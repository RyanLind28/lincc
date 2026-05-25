const MAX_DIMENSION_AVATAR = 800; // px — for profile avatars
const MAX_DIMENSION_COVER = 1200; // px — for event/voucher cover images
const JPEG_QUALITY = 0.8;
// 25MB — Samsung high-MP cameras commonly produce 12–18MB JPEGs at full res.
// Output is canvas-recompressed to ~150KB regardless of input size.
const MAX_INPUT_SIZE = 25 * 1024 * 1024;
const MAX_INPUT_SIZE_LABEL = '25MB';

// Total wall-clock budget for the recovery cascade. Each stage has its own
// inner timeout; this is a belt-and-braces cap so a wedged decode can't hang
// the picker indefinitely.
const RECOVERY_BUDGET_MS = 20_000;
const IMAGE_LOAD_TIMEOUT_MS = 15_000;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',     // Samsung Gallery / older Android pickers
  'image/pjpeg',   // legacy progressive JPEG MIME
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

// HEIC/HEIF brands that may appear in the ftyp box (offset 4..8 in the file).
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']);

type DetectedFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'heic' | null;

// User-facing copy when every read path failed. Points at the Android Share
// intent — that route hands Chrome a fresh Content URI from the source app,
// which side-steps the picker URI that just failed us.
const UNREADABLE_MESSAGE =
  "This photo couldn't be opened. It may be stored in the cloud and not downloaded to your device yet. " +
  "Try taking a fresh photo with your camera, or open the photo in your gallery first to download it.";

export type RecoveryAttempt = {
  stage: 'imageBitmap' | 'fileReader' | 'stream' | 'responseStream' | 'imageElement';
  outcome: 'recovered' | 'timeout' | 'unsupported' | 'null-result' | 'error';
  detail?: string;
};

export type ImageValidationResult =
  | {
      ok: true;
      file: File;
      format: DetectedFormat;
      recovered: boolean;
      arrayBufferError?: string;
      recoveryAttempts?: RecoveryAttempt[];
    }
  | {
      ok: false;
      error: string;
      arrayBufferError?: string;
      recoveryAttempts?: RecoveryAttempt[];
    };

type RecoveryStageResult =
  | { ok: true; file: File }
  | { ok: false; outcome: Exclude<RecoveryAttempt['outcome'], 'recovered'>; detail?: string };

function detectFormatFromBytes(bytes: Uint8Array): DetectedFormat {
  if (bytes.length < 4) return null;

  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';

  // RIFF....WEBP — bytes 0..3 = "RIFF", bytes 8..11 = "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';

  // HEIC/HEIF: ISO BMFF box — bytes 4..7 = "ftyp", bytes 8..11 = brand (4 chars)
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (HEIC_BRANDS.has(brand)) return 'heic';
  }

  return null;
}

// Sentinel thrown by raceTimeout when the inner promise hasn't settled in time.
// Distinguishing this from a regular rejection lets the cascade record
// "timeout" vs "error" separately in Sentry breadcrumbs.
class TimeoutError extends Error {
  constructor(message = 'timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new TimeoutError());
    }, ms);
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Squashes any unknown thrown value into a short, Sentry-friendly string.
// Keep the result bounded so it can't blow out the event payload.
function summariseError(err: unknown): string {
  if (err instanceof Error) {
    const name = err.name || 'Error';
    const message = err.message ? `: ${err.message}` : '';
    return `${name}${message}`.slice(0, 200);
  }
  return String(err).slice(0, 200);
}

function stageFailure(err: unknown): RecoveryStageResult {
  if (err instanceof TimeoutError) return { ok: false, outcome: 'timeout' };
  return { ok: false, outcome: 'error', detail: summariseError(err) };
}

// --- Recovery cascade --------------------------------------------------------
// Different browser APIs go through different internal read paths inside
// Chrome. When the Promise-based `Blob.arrayBuffer()` fails on a Samsung
// Content URI, one of these alternative paths frequently still works.
// Each helper returns a JS-owned File (decoupled from the original URI) or
// null. They never throw.

async function recoverViaImageBitmap(file: File): Promise<RecoveryStageResult> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return { ok: false, outcome: 'unsupported' };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await raceTimeout(createImageBitmap(file), IMAGE_LOAD_TIMEOUT_MS);
  } catch (err) {
    return stageFailure(err);
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, outcome: 'error', detail: 'no-canvas-2d-context' };
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) return { ok: false, outcome: 'null-result', detail: 'canvas-toBlob-null' };
    return { ok: true, file: new File([blob], renameToJpg(file.name), { type: 'image/jpeg' }) };
  } catch (err) {
    return stageFailure(err);
  } finally {
    if ('close' in bitmap) bitmap.close();
  }
}

async function recoverViaFileReader(file: File): Promise<RecoveryStageResult> {
  if (typeof FileReader === 'undefined') {
    return { ok: false, outcome: 'unsupported' };
  }
  try {
    const buffer = await raceTimeout(
      new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (result instanceof ArrayBuffer) resolve(result);
          else reject(new Error('FileReader returned non-ArrayBuffer'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
        reader.readAsArrayBuffer(file);
      }),
      IMAGE_LOAD_TIMEOUT_MS,
    );
    return { ok: true, file: new File([buffer], file.name, { type: file.type || 'image/jpeg' }) };
  } catch (err) {
    return stageFailure(err);
  }
}

// `new Response(blob).arrayBuffer()` exercises the fetch stack rather than the
// direct Blob read path. On some Android Chrome builds this succeeds when
// `blob.arrayBuffer()` returns NotReadableError on the same Content URI.
async function recoverViaResponseStream(file: File): Promise<RecoveryStageResult> {
  if (typeof Response === 'undefined') {
    return { ok: false, outcome: 'unsupported' };
  }
  try {
    const buffer = await raceTimeout(new Response(file).arrayBuffer(), IMAGE_LOAD_TIMEOUT_MS);
    return { ok: true, file: new File([buffer], file.name, { type: file.type || 'image/jpeg' }) };
  } catch (err) {
    return stageFailure(err);
  }
}

// ReadableStream API — exercises a different Chrome I/O pipe than arrayBuffer()
// or FileReader. On some Android builds this path stays open when others fail.
async function recoverViaStream(file: File): Promise<RecoveryStageResult> {
  if (typeof file.stream !== 'function') {
    return { ok: false, outcome: 'unsupported' };
  }
  try {
    const reader = file.stream().getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const result = await raceTimeout(reader.read(), IMAGE_LOAD_TIMEOUT_MS);
      if (result.done) {
        done = true;
      } else {
        chunks.push(result.value);
      }
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
    if (totalLength === 0) return { ok: false, outcome: 'null-result', detail: 'stream-empty' };
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, file: new File([merged], file.name, { type: file.type || 'image/jpeg' }) };
  } catch (err) {
    return stageFailure(err);
  }
}

// Last resort: load the file through `<img src=createObjectURL>`. Even when
// every byte-read API fails, the renderer sometimes materialises pixels by
// going through the platform image decoder directly.
async function recoverViaImageElement(file: File): Promise<RecoveryStageResult> {
  if (typeof URL === 'undefined' || typeof Image === 'undefined') {
    return { ok: false, outcome: 'unsupported' };
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await raceTimeout(loadImage(objectUrl), IMAGE_LOAD_TIMEOUT_MS);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, outcome: 'error', detail: 'no-canvas-2d-context' };
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) return { ok: false, outcome: 'null-result', detail: 'canvas-toBlob-null' };
    return { ok: true, file: new File([blob], renameToJpg(file.name), { type: 'image/jpeg' }) };
  } catch (err) {
    return stageFailure(err);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

function renameToJpg(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '') + '.jpg';
}

async function runRecoveryCascade(
  file: File,
): Promise<{ file: File | null; attempts: RecoveryAttempt[] }> {
  const deadline = Date.now() + RECOVERY_BUDGET_MS;
  const stages: Array<{ name: RecoveryAttempt['stage']; run: (f: File) => Promise<RecoveryStageResult> }> = [
    { name: 'imageBitmap', run: recoverViaImageBitmap },
    { name: 'fileReader', run: recoverViaFileReader },
    { name: 'stream' as RecoveryAttempt['stage'], run: recoverViaStream },
    { name: 'responseStream', run: recoverViaResponseStream },
    { name: 'imageElement', run: recoverViaImageElement },
  ];
  const attempts: RecoveryAttempt[] = [];
  for (const stage of stages) {
    if (Date.now() >= deadline) {
      attempts.push({ stage: stage.name, outcome: 'timeout', detail: 'cascade-budget-exhausted' });
      break;
    }
    let result: RecoveryStageResult;
    try {
      result = await stage.run(file);
    } catch (err) {
      result = stageFailure(err);
    }
    if (result.ok) {
      attempts.push({ stage: stage.name, outcome: 'recovered' });
      return { file: result.file, attempts };
    }
    attempts.push({ stage: stage.name, outcome: result.outcome, detail: result.detail });
  }
  return { file: null, attempts };
}

// --- Public API --------------------------------------------------------------

/**
 * Validates a picked image and returns a JS-owned `File` for downstream use.
 *
 * The returned `file` is always a fresh `File` backed by an in-memory buffer
 * (or a recovered canvas re-render). This insulates callers from Android
 * Content URI lifetime issues — once we hand back `validation.file`, the
 * original picker URI can be revoked (e.g. via `input.value = ''`) without
 * breaking subsequent reads.
 */
export async function validateImageDetailed(file: File): Promise<ImageValidationResult> {
  if (file.size > MAX_INPUT_SIZE) {
    return { ok: false, error: `Image must be less than ${MAX_INPUT_SIZE_LABEL}` };
  }

  // Fast path: read the bytes once, clone into a JS-owned File, detect format
  // from magic bytes. A single read is friendlier to Samsung's ContentProvider
  // than multiple slice reads, and the clone decouples downstream code from
  // the original Content URI.
  let buffer: ArrayBuffer | null = null;
  let arrayBufferError: string | undefined;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    arrayBufferError = summariseError(err);
  }

  if (buffer) {
    const cloned = new File([buffer], file.name, { type: file.type || 'image/jpeg' });
    const format = detectFormatFromBytes(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)));
    if (format) return { ok: true, file: cloned, format, recovered: false };
    if (file.type && ALLOWED_TYPES.has(file.type)) {
      // Unknown header but a trusted MIME — accept and let the canvas pipeline
      // handle it.
      return { ok: true, file: cloned, format: null, recovered: false };
    }
    return { ok: false, error: 'File does not appear to be a valid image' };
  }

  // arrayBuffer() failed — before the full cascade, try one more direct read:
  // slice the entire Blob and read the slice. On some Android versions this
  // goes through a different ContentProvider code path that stays open.
  try {
    const sliced = file.slice(0, file.size, file.type);
    buffer = await raceTimeout(sliced.arrayBuffer(), 5000);
    if (buffer && buffer.byteLength > 0) {
      const cloned = new File([buffer], file.name, { type: file.type || 'image/jpeg' });
      const format = detectFormatFromBytes(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)));
      return {
        ok: true,
        file: cloned,
        format: format ?? null,
        recovered: true,
        arrayBufferError,
        recoveryAttempts: [{ stage: 'stream' as RecoveryAttempt['stage'], outcome: 'recovered', detail: 'blob-slice-reread' }],
      };
    }
  } catch {
    // Slice re-read also failed — continue to full cascade
  }

  // Run the full recovery cascade. Any successful stage produces a re-encoded
  // JPEG (or a fresh JS-owned File), so we don't need to re-validate magic bytes.
  const { file: recovered, attempts } = await runRecoveryCascade(file);
  if (recovered) {
    return {
      ok: true,
      file: recovered,
      format: 'jpeg',
      recovered: true,
      arrayBufferError,
      recoveryAttempts: attempts,
    };
  }

  return {
    ok: false,
    error: UNREADABLE_MESSAGE,
    arrayBufferError,
    recoveryAttempts: attempts,
  };
}

/**
 * Backwards-compatible wrapper — returns error string or null.
 * Prefer `validateImageDetailed` so you can use the recovered `file`.
 */
export async function validateImage(file: File): Promise<string | null> {
  const result = await validateImageDetailed(file);
  return result.ok ? null : result.error;
}

export function validateImageSize(file: File): string | null {
  if (file.size > MAX_INPUT_SIZE) {
    return `Image must be less than ${MAX_INPUT_SIZE_LABEL}`;
  }
  return null;
}

/**
 * Converts HEIC/HEIF to JPEG client-side via heic2any. Other formats pass through
 * unchanged. heic2any is loaded lazily so the ~700KB libheif WASM only ships when
 * a user actually picks an iPhone photo.
 */
export async function convertHeicIfNeeded(file: File, format: DetectedFormat): Promise<File> {
  if (format !== 'heic') return file;

  // Lazy-load — keeps the libheif blob out of the main bundle.
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  // heic2any may return Blob | Blob[] (multi-image HEIC). Take the first frame.
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
}

/**
 * Compresses an image file client-side using Canvas. The Canvas re-render strips
 * any embedded scripts, EXIF exploits, or payloads — output is clean pixel JPEG.
 * Caller is responsible for converting HEIC first via convertHeicIfNeeded.
 */
export function compressImage(file: File | Blob, maxDimension = MAX_DIMENSION_AVATAR): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > 10000 || height > 10000) {
        reject(new Error('Image dimensions too large (max 10000x10000)'));
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image — file may be corrupt or in an unsupported format'));
    };

    img.src = url;
  });
}

export { MAX_DIMENSION_COVER, MAX_DIMENSION_AVATAR };

/**
 * Crop a region of an image to a square (or specified aspect) and return a JPEG blob.
 * Used by the avatar cropper UI.
 */
export async function cropImageToBlob(
  src: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputDimension = MAX_DIMENSION_AVATAR,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputDimension;
      canvas.height = outputDimension;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, outputDimension, outputDimension,
      );
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to encode cropped image')),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = src;
  });
}
