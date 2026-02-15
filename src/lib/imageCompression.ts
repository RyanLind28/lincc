const MAX_DIMENSION = 800; // px — plenty for profile avatars
const JPEG_QUALITY = 0.8;
const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates file size before compression.
 * Returns an error message if invalid, null if OK.
 */
export function validateImageSize(file: File): string | null {
  if (file.size > MAX_INPUT_SIZE) {
    return 'Image must be less than 10MB';
  }
  return null;
}

/**
 * Compresses an image file client-side using Canvas.
 * Resizes to max 800x800 (maintaining aspect ratio) and outputs JPEG at 80% quality.
 * Typical output: 100-400KB from a 5-8MB phone photo.
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if either dimension exceeds max
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
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
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
