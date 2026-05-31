import { logUpload } from './uploadDebug';

const MAX_DIMENSION_AVATAR = 800; // px — for profile avatars
const MAX_DIMENSION_COVER = 1200; // px — for event/voucher cover images
const JPEG_QUALITY = 0.8;
// 25MB — Samsung high-MP cameras commonly produce 12–18MB JPEGs at full res.
// Output is canvas-recompressed to ~150KB regardless of input size.
const MAX_INPUT_SIZE = 25 * 1024 * 1024;
const MAX_INPUT_SIZE_LABEL = '25MB';

// Timeout for the PRIMARY file.arrayBuffer() read. On Android a flaky content://
// URI can make this hang indefinitely (no resolve, no reject) — this cap turns
// that hang into a fast, recoverable failure.
const PRIMARY_READ_TIMEOUT_MS = 8_000;

// Timeout for the single slice-reread fallback. Short on purpose — if the first
// direct read failed, a cloud-backed file won't materialise no matter how long
// we wait, so we fail fast rather than hang the picker.
const SLICE_REREAD_TIMEOUT_MS = 5_000;

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

// User-facing copy for the dominant Samsung failure: the picked file has zero
// bytes because Samsung Gallery / OneDrive / Google Photos offloaded it to the
// cloud and never downloaded it back. No client-side read can recover bytes
// that aren't on the device, so we point the user straight at the camera (which
// always works) or at re-downloading the photo in Gallery first.
const EMPTY_FILE_MESSAGE =
  "This photo hasn't downloaded to your phone yet. Samsung Gallery often keeps photos in the cloud. " +
  "Tap 'Take a photo' to use your camera, or open the photo in Gallery first to download it, then try again.";

// Fallback copy when the read genuinely failed for a non-empty file.
const UNREADABLE_MESSAGE =
  "This photo couldn't be opened. It may still be syncing from the cloud. " +
  "Try taking a fresh photo with your camera, or open the photo in Gallery first to download it.";

// Kept as a lightweight record for Sentry breadcrumbs. The old multi-stage
// cascade is gone (it could never read a zero-byte file); we now record only
// the fast path and the single slice-reread fallback.
export type RecoveryAttempt = {
  stage: 'arrayBuffer' | 'sliceReread';
  outcome: 'recovered' | 'timeout' | 'null-result' | 'error';
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
  // Zero-byte guard — the dominant Samsung failure. When Gallery hands the
  // browser a cloud-offloaded photo, the File handle exists (name, type) but
  // `file.size` is 0 and every byte read fails with NotReadableError. There is
  // nothing on the device to read, so we bail immediately with a clear,
  // camera-first message rather than churning through doomed read attempts.
  if (file.size === 0) {
    return {
      ok: false,
      error: EMPTY_FILE_MESSAGE,
      recoveryAttempts: [{ stage: 'arrayBuffer', outcome: 'null-result', detail: 'zero-byte-file' }],
    };
  }

  if (file.size > MAX_INPUT_SIZE) {
    return { ok: false, error: `Image must be less than ${MAX_INPUT_SIZE_LABEL}` };
  }

  // Fast path: read the bytes once, clone into a JS-owned File, detect format
  // from magic bytes. A single read is friendlier to Samsung's ContentProvider
  // than multiple slice reads, and the clone decouples downstream code from
  // the original Content URI.
  //
  // CRITICAL: this read is wrapped in raceTimeout. On Android, file.arrayBuffer()
  // on a flaky content:// URI can hang forever — never resolving, never
  // rejecting. Without the timeout the whole pick silently stalls: no cropper,
  // no error, "nothing happens". The timeout guarantees we always fall through
  // to the slice retry / clear error instead of hanging.
  logUpload('validate:start', `${file.name} | ${file.size}b | ${file.type || 'no-type'}`);
  let buffer: ArrayBuffer | null = null;
  let arrayBufferError: string | undefined;
  try {
    buffer = await raceTimeout(file.arrayBuffer(), PRIMARY_READ_TIMEOUT_MS);
    logUpload('validate:arrayBuffer-ok', `${buffer.byteLength}b`);
  } catch (err) {
    arrayBufferError = summariseError(err);
    logUpload('validate:arrayBuffer-fail', arrayBufferError);
  }

  if (buffer && buffer.byteLength > 0) {
    const cloned = new File([buffer], file.name, { type: file.type || 'image/jpeg' });
    const format = detectFormatFromBytes(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)));
    if (format) {
      logUpload('validate:ok', `format=${format}`);
      return { ok: true, file: cloned, format, recovered: false };
    }
    if (file.type && ALLOWED_TYPES.has(file.type)) {
      // Unknown header but a trusted MIME — accept and let the canvas pipeline
      // handle it.
      logUpload('validate:ok', 'trusted-mime, no magic-byte match');
      return { ok: true, file: cloned, format: null, recovered: false };
    }
    logUpload('validate:reject', 'not-a-valid-image');
    return { ok: false, error: 'File does not appear to be a valid image' };
  }

  // arrayBuffer() failed (or returned empty). One cheap retry: slice the whole
  // Blob and read the slice. On some Android builds this goes through a
  // different ContentProvider code path that stays open. If this also fails the
  // bytes genuinely aren't reachable — no further read API will change that.
  try {
    logUpload('validate:slice-retry');
    const sliced = file.slice(0, file.size, file.type);
    buffer = await raceTimeout(sliced.arrayBuffer(), SLICE_REREAD_TIMEOUT_MS);
    if (buffer && buffer.byteLength > 0) {
      logUpload('validate:slice-ok', `${buffer.byteLength}b`);
      const cloned = new File([buffer], file.name, { type: file.type || 'image/jpeg' });
      const format = detectFormatFromBytes(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)));
      return {
        ok: true,
        file: cloned,
        format: format ?? null,
        recovered: true,
        arrayBufferError,
        recoveryAttempts: [{ stage: 'sliceReread', outcome: 'recovered', detail: 'blob-slice-reread' }],
      };
    }
  } catch (err) {
    logUpload('validate:slice-fail', summariseError(err));
    return {
      ok: false,
      error: UNREADABLE_MESSAGE,
      arrayBufferError,
      recoveryAttempts: [{ stage: 'sliceReread', outcome: summariseSliceOutcome(err), detail: summariseError(err) }],
    };
  }

  logUpload('validate:slice-empty');
  return {
    ok: false,
    error: UNREADABLE_MESSAGE,
    arrayBufferError,
    recoveryAttempts: [{ stage: 'sliceReread', outcome: 'null-result', detail: 'slice-empty' }],
  };
}

function summariseSliceOutcome(err: unknown): RecoveryAttempt['outcome'] {
  return err instanceof TimeoutError ? 'timeout' : 'error';
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
