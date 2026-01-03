import type { PreviewSource } from './types.js';

export const supportsImageProcessing = (): boolean => {
  if (typeof FileReader === 'undefined') return false;
  if (typeof Blob === 'undefined') return false;
  if (
    typeof URL === 'undefined' ||
    !URL.createObjectURL ||
    !URL.revokeObjectURL
  )
    return false;

  const canvasProto =
    typeof HTMLCanvasElement !== 'undefined'
      ? HTMLCanvasElement.prototype
      : null;
  const canvasToBlob =
    !!canvasProto && typeof canvasProto.toBlob === 'function';

  if (!canvasToBlob) return false;

  return true;
};

export const processDataUrl = (
  blob: Blob | File,
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
    reader.readAsDataURL(blob);
  });
};

export const buildPreviewSrc = async (
  source: File | Blob
): Promise<PreviewSource> => {
  try {
    if (
      typeof URL !== 'undefined' &&
      URL.createObjectURL &&
      URL.revokeObjectURL
    ) {
      const src = URL.createObjectURL(source);
      return {
        src,
        revoke: () => URL.revokeObjectURL(src),
      };
    }
  } catch {}

  // Fallback (File)
  if (source instanceof File)
    return {
      src: await processDataUrl(source, 'Failed to read file'),
    };

  // Fallback (Blob)
  return {
    src: await processDataUrl(source, 'Failed to convert blob'),
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
