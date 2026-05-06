const MAX_DIMENSION_AVATAR = 800; // px — for profile avatars
const MAX_DIMENSION_COVER = 1200; // px — for event/voucher cover images
const JPEG_QUALITY = 0.8;
// 25MB — Samsung high-MP cameras commonly produce 12–18MB JPEGs at full res.
// Output is canvas-recompressed to ~150KB regardless of input size.
const MAX_INPUT_SIZE = 25 * 1024 * 1024;
const MAX_INPUT_SIZE_LABEL = '25MB';

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

/**
 * Thrown when the underlying file bytes can't be read — typically because the
 * photo is a cloud placeholder (Samsung Cloud / Google Photos sync), lives on an
 * unmounted SD card, or sits inside Samsung Secure Folder. The picker hands back
 * a reference but `arrayBuffer()` fails with NotReadableError.
 */
export class FileReadError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FileReadError';
    this.cause = cause;
  }
}

/**
 * Reads the first bytes of a file to detect its real format from magic bytes.
 * The previous implementation used a too-loose `[0x00, 0x00, 0x00]` HEIC signature
 * that passed for many non-images. This version checks the proper ftyp box brand.
 */
async function detectImageFormat(file: File): Promise<DetectedFormat> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.slice(0, 16).arrayBuffer();
  } catch (err) {
    // NotReadableError on Android/Samsung means the photo is a cloud-only
    // placeholder. Surface this distinctly so the UI can tell the user to
    // download it to the device first.
    throw new FileReadError(
      "Couldn't read this photo. It might be saved to cloud storage (Samsung Cloud, Google Photos) — open it in your gallery to download it to your device, then try again.",
      err,
    );
  }
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';

  // RIFF....WEBP — bytes 0..3 = "RIFF", bytes 8..11 = "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';

  // HEIC/HEIF: ISO BMFF box — bytes 4..7 = "ftyp", bytes 8..11 = brand (4 chars)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (HEIC_BRANDS.has(brand)) return 'heic';
  }

  return null;
}

export type ImageValidationResult = { ok: true; format: DetectedFormat } | { ok: false; error: string };

/**
 * Returns a structured result so callers can branch on format (e.g. trigger HEIC
 * conversion) without re-detecting. Use `validateImage` for the simpler error-or-null API.
 */
export async function validateImageDetailed(file: File): Promise<ImageValidationResult> {
  if (file.size > MAX_INPUT_SIZE) {
    return { ok: false, error: `Image must be less than ${MAX_INPUT_SIZE_LABEL}` };
  }

  // Magic bytes are authoritative — Samsung/Android pickers regularly mis-label
  // valid JPEGs as `image/jpg`, `application/octet-stream`, or empty string. If
  // the bytes are a real image we accept it regardless of MIME; only fall back
  // to the MIME check when detection comes back null.
  let format: DetectedFormat;
  try {
    format = await detectImageFormat(file);
  } catch (err) {
    if (err instanceof FileReadError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  if (format) {
    return { ok: true, format };
  }

  if (file.type && ALLOWED_TYPES.has(file.type)) {
    // Unknown header but a trusted MIME — accept and let the canvas pipeline
    // handle it. Returning `null` keeps `convertHeicIfNeeded` a no-op.
    return { ok: true, format: null };
  }

  return { ok: false, error: 'File does not appear to be a valid image' };
}

/**
 * Backwards-compatible wrapper — returns error string or null.
 */
export async function validateImage(file: File): Promise<string | null> {
  const result = await validateImageDetailed(file);
  return result.ok ? null : result.error;
}

export function validateImageSize(file: File): string | null {
  if (file.size > MAX_INPUT_SIZE) {
    return 'Image must be less than 10MB';
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
