const MAX_DIMENSION_AVATAR = 800; // px — for profile avatars
const MAX_DIMENSION_COVER = 1200; // px — for event/voucher cover images
const JPEG_QUALITY = 0.8;
const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed image MIME types
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

// Magic bytes for common image formats
const IMAGE_SIGNATURES: [number[], string][] = [
  [[0xFF, 0xD8, 0xFF], 'JPEG'],
  [[0x89, 0x50, 0x4E, 0x47], 'PNG'],
  [[0x47, 0x49, 0x46], 'GIF'],
  [[0x52, 0x49, 0x46, 0x46], 'WEBP/RIFF'],
  [[0x00, 0x00, 0x00], 'HEIC/HEIF/MP4'], // ftyp containers
];

/**
 * Reads the first bytes of a file to verify it's actually an image.
 * Checks magic bytes (file signature) rather than trusting the MIME type.
 */
async function verifyImageMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [signature] of IMAGE_SIGNATURES) {
    if (signature.every((byte, i) => bytes[i] === byte)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates an image file before processing.
 * Checks: file size, MIME type, and magic bytes.
 * Returns an error message if invalid, null if OK.
 */
export async function validateImage(file: File): Promise<string | null> {
  // Size check
  if (file.size > MAX_INPUT_SIZE) {
    return 'Image must be less than 10MB';
  }

  // MIME type check
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Unsupported image format. Use JPEG, PNG, WebP, or GIF.';
  }

  // Magic byte verification — ensures the file content matches an image format
  const isRealImage = await verifyImageMagicBytes(file);
  if (!isRealImage) {
    return 'File does not appear to be a valid image';
  }

  return null;
}

/**
 * Synchronous size-only check (backwards compatible).
 */
export function validateImageSize(file: File): string | null {
  if (file.size > MAX_INPUT_SIZE) {
    return 'Image must be less than 10MB';
  }
  return null;
}

/**
 * Compresses an image file client-side using Canvas.
 * The Canvas re-render strips any embedded scripts, EXIF exploits, or payloads —
 * the output is a clean JPEG with only pixel data.
 *
 * @param file - The image file to compress
 * @param maxDimension - Max width/height (default 800 for avatars)
 */
export function compressImage(file: File, maxDimension = MAX_DIMENSION_AVATAR): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Reject absurdly large images that could crash the browser
      if (width > 10000 || height > 10000) {
        reject(new Error('Image dimensions too large (max 10000x10000)'));
        return;
      }

      // Scale down if either dimension exceeds max
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
      reject(new Error('Failed to load image — file may be corrupt or not a valid image'));
    };

    img.src = url;
  });
}

// Export constants for use in upload flows
export { MAX_DIMENSION_COVER, MAX_DIMENSION_AVATAR };
