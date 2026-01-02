import type { DecodedImage } from './types.js';

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',');
  const mime = header.split(':')[1].split(';')[0];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Blob([bytes], { type: mime });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> => {
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
        'image/jpeg',
        quality
      );
    });
  }

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

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);

  return canvasToBlob(canvas, quality);
};
