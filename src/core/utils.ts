import type { PreviewSource } from './types.js';
import { getRuntimeSupport } from './runtime.js';

export const supports = getRuntimeSupport();

export const supportsImageProcessing = (): boolean => {
  const supports = getRuntimeSupport();

  return (
    supports.FileReader &&
    supports.HTMLCanvasElement &&
    (supports.Blob || supports.File)
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

  // Fallback (Blob)
  if (supports.Blob && source instanceof Blob) {
    return {
      src: await processDataUrl(source, 'Failed to convert blob'),
    };
  }

  // Fallback (File)
  if (supports.File && source instanceof File) {
    return {
      src: await processDataUrl(source, 'Failed to read file'),
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
