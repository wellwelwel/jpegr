import { RuntimeSupport } from './types.js';

export const getRuntimeSupport = (): RuntimeSupport => {
  const canvasProto =
    typeof HTMLCanvasElement !== 'undefined'
      ? HTMLCanvasElement.prototype
      : null;

  return Object.freeze({
    FileReader: typeof FileReader !== 'undefined',
    Blob: typeof Blob !== 'undefined',
    HTMLCanvasElement: typeof HTMLCanvasElement !== 'undefined',
    canvasToBlob: !!canvasProto && typeof canvasProto.toBlob === 'function',
    createObjectURL:
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function' &&
      typeof URL.revokeObjectURL === 'function',
    createImageBitmap: typeof createImageBitmap !== 'undefined',
    File: typeof File !== 'undefined',
  });
};
