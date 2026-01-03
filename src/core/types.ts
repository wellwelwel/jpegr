/**
 * Metadata about the processed image
 */
export type ProcessedImageMetadata = Readonly<{
  originalSize: number;
  originalType: string;
  processedSize: number;
  wasConverted: boolean;
  wasCompressed: boolean;
  compressionQuality: number;
}>;

/**
 * Processed image result
 */
export type ProcessedImage = Readonly<{
  blob: Blob;
  dataUrl: string;
  metadata: ProcessedImageMetadata;
  /** Optional function to revoke Object URLs and free memory */
  revoke?: () => void;
}>;

/**
 * Result of image processing operation
 */
export type ProcessResult =
  | { success: true; image: ProcessedImage }
  | { success: false; error: string };

/**
 * Configuration options for JPGER
 */
export type JPGEROptions = Readonly<{
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
}>;

export type DecodedImage = {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly dispose: () => void;
};

export type CompressionResult = {
  blob: Blob;
  finalQuality: number;
  wasCompressed: boolean;
};

export type CompressionOptions = {
  maxSize: number;
  originalSize: number;
  maxQuality: number;
  minQuality: number;
  compressionStep: number;
};

export type PreviewSource = Readonly<{
  src: string;
  revoke?: () => void;
}>;

/**
 * **Note:** When a fallback is not available, **JPEGR** will use the original image.
 */
export type RuntimeSupport = Readonly<{
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
}>;
