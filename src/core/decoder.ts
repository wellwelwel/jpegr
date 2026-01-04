import type { DecodedImage } from './types.js';
import {
  processDataUrl,
  processDataUrlViaResponse,
  supports,
} from './utils.js';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid image file'));
    image.src = src;
  });
};

const getDataUrl = async (file: File | Blob): Promise<string> => {
  if (supports.FileReader) return processDataUrl(file, 'Failed to read file');
  if (supports.Response) return processDataUrlViaResponse(file);

  throw new Error('No supported methods to read file as data URL.');
};

export const decodeImage = async (file: File | Blob): Promise<DecodedImage> => {
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
    } catch {}
  }

  // Fallback
  const dataUrl = await getDataUrl(file);
  const image = await loadImage(dataUrl);

  return {
    source: image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    dispose: () => {},
  };
};
