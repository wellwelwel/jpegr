import type { DecodedImage } from './types.js';
import { binaryToArrayBuffer } from './binary.js';
import { supports } from './utils.js';

const dataUrlToFile = (dataUrl: string): File | Blob => {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.split(':')[1].split(';')[0];
  const decodedBinary = atob(base64);
  const buffer = binaryToArrayBuffer(decodedBinary);

  if (supports.Blob) return new Blob([buffer], { type: mimeType });

  return new File([buffer], 'image.jpg', { type: mimeType });
};

const canvasToFile = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<File | Blob> => {
  if (supports.Blob && supports.canvasToBlob)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
        'image/jpeg',
        quality
      );
    });

  return Promise.resolve(
    dataUrlToFile(canvas.toDataURL('image/jpeg', quality))
  );
};

export const encodeToJpeg = (
  decoded: DecodedImage,
  quality: number
): Promise<File | Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context not supported');

  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);

  return canvasToFile(canvas, quality);
};
