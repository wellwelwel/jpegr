import type {
  JPGEROptions,
  ProcessedImage,
  ProcessResult,
  RuntimeSupport,
} from './core/types.js';
import { compressToFit } from './core/compressor.js';
import { decodeImage } from './core/decoder.js';
import {
  buildPreviewSrc,
  formatBytes,
  supports,
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

  private readonly previewElement: HTMLImageElement | null = null;
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

  /**
   * Returns browser runtime support for image processing features.
   */
  static getRuntimeSupport(): RuntimeSupport {
    return supports;
  }

  /**
   * Returns whether the current browser supports image processing.
   */
  static canProcess(): boolean {
    return supportsImageProcessing();
  }

  /**
   * Clears the current processed image and frees associated resources.
   */
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

      let blob: File | Blob;
      let converted = false;
      let compressed = false;
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
        converted = file.type !== 'image/jpeg';
        decoded = await decodeImage(file);

        const result = await compressToFit(decoded, {
          maxSize,
          originalSize,
          maxQuality: this.maxQuality,
          minQuality: this.minQuality,
          compressionStep: this.compressionStep,
        });

        blob = result.blob;
        compressed = result.compressed;
        finalQuality = result.finalQuality;
      }

      this.processedImage?.revoke?.();

      const previewSrc = await buildPreviewSrc(blob);
      const processed: ProcessedImage = {
        file: blob,
        src: previewSrc.src,
        metadata: {
          original: {
            size: originalSize,
            sizeFormatted: formatBytes(originalSize),
            type: originalType,
          },
          processed: {
            size: blob.size,
            sizeFormatted: formatBytes(blob.size),
            type: blob.type,
            converted,
            compressed,
            quality: finalQuality,
          },
        },
      };

      this.processedImage = processed;
      this.syncPreview();

      return { success: true, image: processed };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process image.',
      };
    } finally {
      decoded?.dispose();
    }
  }

  /**
   * Uploads the processed image to the specified URL using a POST request by default.
   */
  async upload(
    url: string,
    options?: {
      field?: string;
      name?: string;
      init?: RequestInit;
    }
  ): Promise<Response> {
    if (!this.processedImage) throw new Error('No processed image to upload.');

    const {
      field = 'image',
      name = 'image.jpeg',
      init,
    } = options ?? Object.create(null);

    const formData = new FormData();
    formData.append(field, this.processedImage.file, name);

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

    element.src = this.processedImage.src;
    element.alt = 'Image preview';
  }
}

export type {
  JPGEROptions,
  ProcessResult,
  RuntimeSupport,
} from './core/types.js';
