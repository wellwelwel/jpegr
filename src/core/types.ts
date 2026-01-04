export type ProcessedImageMetadata = {
  size: number;
  sizeFormatted: string;
  type: string;
  converted: boolean;
  compressed: boolean;
  quality: number;
};

export type SourceImageMetadata = {
  size: number;
  sizeFormatted: string;
  type: string;
};

/**
 * Processed image result
 */
export type ProcessedImage = {
  file: Blob | File;
  src: string;
  metadata: {
    original: SourceImageMetadata;
    processed: ProcessedImageMetadata;
  };
  /** Internal function to revoke Object URLs and free memory */
  revoke?: () => void;
};

/**
 * Result of image processing operation
 */
export type ProcessResult = {
  success: boolean;
  error?: string;
  image?: ProcessedImage;
};

/**
 * Configuration options for JPGER
 */
export type JPGEROptions = {
  /** Element to preview the processed image */
  preview?: HTMLImageElement | null;
  /** Maximum file size in bytes (default: 1MB) */
  maxSize?: number;
  /** Maximum quality for JPEG encoding (0.1 to 1.0, default: 1.0) */
  maxQuality?: number;
  /** Quality reduction step during compression (default: 0.1) */
  compressionStep?: number;
  /** Minimum quality threshold (default: 0.1) */
  minQuality?: number;
};

export type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

export type CompressionResult = {
  blob: File | Blob;
  finalQuality: number;
  compressed: boolean;
};

export type CompressionOptions = {
  maxSize: number;
  originalSize: number;
  maxQuality: number;
  minQuality: number;
  compressionStep: number;
};

export type PreviewSource = {
  src: string;
  revoke?: () => void;
};

/**
 * **Note:** When a fallback is not available, **JPEGR** will use the original image.
 */
export type RuntimeSupport = {
  /** Fallback availabe: ❌ */
  HTMLCanvasElement: boolean;
  /** Fallback availabe: ❌ */
  FileReader: boolean;
  /** Fallback availabe: File required */
  Blob: boolean;
  /** Fallback availabe: Blob required */
  File: boolean;
  /** Fallback availabe: ✅ */
  canvasToBlob: boolean;
  /** Fallback availabe: ✅ */
  createObjectURL: boolean;
  /** Fallback availabe: ✅ */
  createImageBitmap: boolean;
};
