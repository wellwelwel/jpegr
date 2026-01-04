import type { PreviewSource } from './types.js';
import { arrayBufferToBinary } from './binary.js';
import { getRuntimeSupport } from './runtime.js';

export const supports = getRuntimeSupport();

export const supportsImageProcessing = (): boolean => {
  const supports = getRuntimeSupport();

  return (
    (supports.FileReader || supports.Response) &&
    supports.HTMLCanvasElement &&
    (supports.Blob || supports.File) &&
    (supports.Uint8Array || supports.DataView)
  );
};

export const processDataUrl = (
  file: File | Blob,
  errorMessage: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error(errorMessage));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const processDataUrlViaResponse = async (
  file: File | Blob
): Promise<string> => {
  const buffer = await new Response(file).arrayBuffer();
  const binary = arrayBufferToBinary(buffer);
  const base64 = btoa(binary);
  const mimeType = file.type || 'application/octet-stream';

  return `data:${mimeType};base64,${base64}`;
};

export const buildPreviewSrc = async (
  source: File | Blob
): Promise<PreviewSource> => {
  if (supports.createObjectURL) {
    const src = URL.createObjectURL(source);
    return {
      src,
      revoke: () => URL.revokeObjectURL(src),
    };
  }

  if (supports.FileReader) {
    if (supports.Blob && source instanceof Blob) {
      return {
        src: await processDataUrl(source, 'Failed to convert blob'),
      };
    }

    if (supports.File && source instanceof File) {
      return {
        src: await processDataUrl(source, 'Failed to read file'),
      };
    }
  }

  if (supports.Response) {
    return {
      src: await processDataUrlViaResponse(source),
    };
  }

  throw new Error('No supported methods to build preview source.');
};

export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
