import type { DecodedImage } from './types.js';

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.split(':')[1].split(';')[0];
  const decodedBinary = atob(base64);

  const byteArray = Uint8Array.from(decodedBinary, (char) =>
    char.charCodeAt(0)
  );

  return new Blob([byteArray], { type: mimeType });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> => {
  if (typeof canvas.toBlob === 'function')
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
        'image/jpeg',
        quality
      );
    });

  // Fallback
  return Promise.resolve(
    dataUrlToBlob(canvas.toDataURL('image/jpeg', quality))
  );
};

export const encodeToJpeg = (
  decoded: DecodedImage,
  quality: number
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context not supported');

  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);

  return canvasToBlob(canvas, quality);
};
