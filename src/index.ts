import type {
  JPGEROptions,
  ProcessedImage,
  ProcessedImageMetadata,
  ProcessResult,
} from './core/types.js';
import { compressToFit } from './core/compressor.js';
import { decodeImage } from './core/decoder.js';
import {
  buildPreviewSrc,
  formatBytes,
  supportsImageProcessing,
} from './core/utils.js';

const DEFAULT_MAX_SIZE = 1024 * 1024; // 1 MB
const DEFAULT_QUALITY = 1;
const DEFAULT_COMPRESSION_STEP = 0.1;
const DEFAULT_MIN_QUALITY = 0.1;

/**
 * **JPGER** - Browser image processing module.
 */
export class JPGER {
  private processedImage: ProcessedImage | null = null;
  private previewElement: HTMLImageElement | null = null;

  private readonly maxSize: number;
  private readonly maxQuality: number;
  private readonly compressionStep: number;
  private readonly minQuality: number;

  constructor(options: JPGEROptions = Object.create(null)) {
    this.previewElement = options.preview ?? null;
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.maxQuality = options.maxQuality ?? DEFAULT_QUALITY;
    this.compressionStep = options.compressionStep ?? DEFAULT_COMPRESSION_STEP;
    this.minQuality = options.minQuality ?? DEFAULT_MIN_QUALITY;

    this.syncPreview();
  }

  get image(): ProcessedImage | null {
    return this.processedImage;
  }

  get fileSize(): number {
    return this.processedImage?.blob.size ?? 0;
  }

  get fileSizeFormatted(): string {
    return formatBytes(this.fileSize);
  }

  get wasConverted(): boolean {
    return this.processedImage?.metadata.wasConverted ?? false;
  }

  get wasCompressed(): boolean {
    return this.processedImage?.metadata.wasCompressed ?? false;
  }

  get compressionQuality(): number {
    return this.processedImage?.metadata.compressionQuality ?? this.maxQuality;
  }

  get metadata(): ProcessedImageMetadata | null {
    return this.processedImage?.metadata ?? null;
  }

  clear(): void {
    this.processedImage?.revoke?.();
    this.processedImage = null;
    this.syncPreview();
  }

  async fromInput(
    input: HTMLInputElement,
    maxSize = this.maxSize
  ): Promise<ProcessResult> {
    const file = input.files?.[0];
    if (!file)
      return {
        success: false,
        error: 'No file selected.',
      };

    return this.fromFile(file, maxSize);
  }

  async fromFile(file: File, maxSize = this.maxSize): Promise<ProcessResult> {
    let decoded = null;

    try {
      const canProcess = supportsImageProcessing();
      const originalSize = file.size;
      const originalType = file.type;

      let blob: Blob;
      let wasConverted = false;
      let wasCompressed = false;
      let finalQuality = this.maxQuality;

      // Fast path: JPEG within size limit OR browser doesn't support processing
      const isJpegWithinLimit =
        file.type === 'image/jpeg' && file.size <= maxSize;

      if (isJpegWithinLimit || !canProcess) {
        // Pass through original file
        // Use original on unsupported browsers
        blob = file;
      } else {
        // Decode and compress
        wasConverted = file.type !== 'image/jpeg';
        decoded = await decodeImage(file);

        const result = await compressToFit(decoded, {
          maxSize,
          originalSize,
          maxQuality: this.maxQuality,
          minQuality: this.minQuality,
          compressionStep: this.compressionStep,
        });

        blob = result.blob;
        wasCompressed = result.wasCompressed;
        finalQuality = result.finalQuality;
      }

      this.processedImage?.revoke?.();

      const previewSrc = await buildPreviewSrc(blob);
      const processed: ProcessedImage = Object.freeze({
        blob,
        dataUrl: previewSrc.src,
        metadata: Object.freeze({
          originalSize,
          originalType,
          processedSize: blob.size,
          wasConverted,
          wasCompressed,
          compressionQuality: finalQuality,
        }),
        revoke: previewSrc.revoke,
      });

      this.processedImage = processed;
      this.syncPreview();

      return { success: true, image: processed };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process image.',
      };
    } finally {
      decoded?.dispose();
    }
  }

  async upload(
    url: string,
    options?: {
      field?: string;
      name?: string;
      init?: RequestInit;
    }
  ): Promise<Response> {
    if (!this.processedImage) {
      throw new Error('No processed image to upload.');
    }

    const {
      field = 'image',
      name = 'image.jpeg',
      init,
    } = options ?? Object.create(null);

    const formData = new FormData();
    formData.append(field, this.processedImage.blob, name);

    const response = await fetch(url, {
      ...init,
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');

    return response;
  }

  private syncPreview(): void {
    const element = this.previewElement;
    if (!element) return;

    if (!this.processedImage) {
      element.removeAttribute('src');
      element.removeAttribute('srcset');
      element.alt = '';
      return;
    }

    element.src = this.processedImage.dataUrl;
    element.alt = 'Image preview';
  }
}

export type {
  JPGEROptions,
  ProcessedImage,
  ProcessedImageMetadata,
  ProcessResult,
} from './core/types.js';
