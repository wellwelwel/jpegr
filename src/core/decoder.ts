import type { DecodedImage } from './types.js';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Failed to read file'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid image file'));
    image.src = src;
  });
};

/**
 * Decodes an image file into a format suitable for canvas rendering.
 *
 * 1. Prefer `createImageBitmap` with `imageOrientation: 'from-image'`
 * 2. Fallback to `HTMLImageElement` for legacy browsers
 */
export const decodeImage = async (file: File): Promise<DecodedImage> => {
  // Modern path: createImageBitmap with automatic orientation
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // Fall through to legacy path
    }
  }

  // Legacy path: HTMLImageElement
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);

  return {
    source: image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    dispose: () => {
      // HTMLImageElement doesn't need explicit cleanup
    },
  };
};
