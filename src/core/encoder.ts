import type { DecodedImage } from './types.js';
import { binaryToArrayBuffer } from './binary.js';
import { supports } from './utils.js';

export const regex = {
  hexColor: /^#([0-9A-Fa-f]{3}){1,2}$/,
};

export const validateHexColor = (color: string): boolean =>
  regex.hexColor.test(color);

export const dataUrlToFile = (dataUrl: string): File | Blob => {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.split(':')[1].split(';')[0];
  const decodedBinary = atob(base64);
  const buffer = binaryToArrayBuffer(decodedBinary);

  if (supports.Blob) return new Blob([buffer], { type: mimeType });

  return new File([buffer], 'image.jpg', { type: mimeType });
};

export const canvasToFile = (
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
  quality: number,
  backgroundColor: string = '#000000'
): Promise<File | Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context not supported');

  if (validateHexColor(backgroundColor) === false)
    throw new Error(
      `Invalid background color: "${backgroundColor}". Expected a hex color string like "#000" or "#000000", for example.`
    );

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);

  return canvasToFile(canvas, quality);
};
