export type ProcessedImageMetadata = {
  readonly originalSize: number;
  readonly originalType: string;
  readonly processedSize: number;
  readonly wasConverted: boolean;
  readonly wasCompressed: boolean;
  readonly compressionQuality: number;
};

export type ProcessedImage = {
  readonly blob: Blob;
  readonly dataUrl: string;
  readonly metadata: ProcessedImageMetadata;
};

export type ProcessResult =
  | { success: true; image: ProcessedImage }
  | { success: false; error: string };

export type JPGEROptions = Readonly<{
  preview?: HTMLImageElement | null;
  maxSize?: number;
  maxQuality?: number;
  compressionStep?: number;
  minQuality?: number;
}>;
