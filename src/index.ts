import type {
  JPGEROptions,
  MergeDirection,
  ProcessedImage,
  ProcessResult,
  RuntimeSupport,
} from './core/types.js';
import { compressToFit } from './core/compressor.js';
import { decodeImage } from './core/decoder.js';
import { mergeImages } from './core/merger.js';
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
  private error: string | null = null;

  private readonly previewElement: HTMLImageElement | null = null;
  private readonly maxSize: number;
  private readonly maxQuality: number;
  private readonly compressionStep: number;
  private readonly minQuality: number;
  private readonly forceCompression: boolean;
  private readonly backgroundColor?: string;

  constructor(options: JPGEROptions = Object.create(null)) {
    this.previewElement = options.preview ?? null;
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.maxQuality = options.maxQuality ?? DEFAULT_QUALITY;
    this.compressionStep = options.compressionStep ?? DEFAULT_COMPRESSION_STEP;
    this.minQuality = options.minQuality ?? DEFAULT_MIN_QUALITY;
    this.forceCompression = options.forceCompression ?? false;
    this.backgroundColor = options.backgroundColor;

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
   * Processes an image from either a File or an HTMLInputElement.
   */
  async process(
    input: File | Blob | HTMLInputElement,
    maxSize = this.maxSize
  ): Promise<ProcessResult> {
    if (input instanceof HTMLInputElement)
      return this.fromInput(input, maxSize);

    if (
      (supports.File && input instanceof File) ||
      (supports.Blob && input instanceof Blob)
    )
      return this.fromFile(input, maxSize);

    throw new Error('Invalid input type. Expected File or HTMLInputElement.');
  }

  /**
   * Clears the current processed image, error state, and frees associated resources.
   */
  clear(): void {
    this.processedImage?.revoke?.();
    this.processedImage = null;
    this.error = null;
    this.syncPreview();
  }

  /**
   * Merges multiple images into a single image vertically or horizontally.
   */
  async merge(
    inputs: (HTMLInputElement | File | Blob)[],
    direction: MergeDirection,
    maxSize = this.maxSize
  ): Promise<ProcessResult> {
    let decoded = null;

    try {
      if (!inputs || inputs.length === 0)
        throw new Error('At least one input is required for merging.');

      const canProcess = supportsImageProcessing();
      if (!canProcess)
        throw new Error(
          'Image merging is not supported in this browser environment.'
        );

      const sources: (File | Blob)[] = [];
      let originalSize = 0;

      for (const input of inputs) {
        if (input instanceof HTMLInputElement) {
          const file = input.files?.[0];
          if (!file) throw new Error('One or more file inputs are empty.');

          sources.push(file);
          originalSize += file.size;
          continue;
        }

        sources.push(input);
        originalSize += input.size;
        continue;
      }

      const merged = await mergeImages(sources, {
        direction,
        quality: this.maxQuality,
        backgroundColor: this.backgroundColor,
      });

      decoded = await decodeImage(merged.file);

      let blob: File | Blob;
      let compressed = false;
      let finalQuality = this.maxQuality;

      if (merged.file.size > maxSize) {
        const result = await compressToFit(decoded, {
          maxSize,
          originalSize: merged.file.size,
          maxQuality: this.maxQuality,
          minQuality: this.minQuality,
          compressionStep: this.compressionStep,
          backgroundColor: this.backgroundColor,
        });

        blob = result.blob;
        compressed = result.compressed;
        finalQuality = result.finalQuality;
      } else blob = merged.file;

      const previewSrc = await buildPreviewSrc(blob);
      const processed: ProcessedImage = {
        file: blob,
        src: previewSrc.src,
        metadata: {
          original: {
            size: originalSize,
            sizeFormatted: formatBytes(originalSize),
            type: 'mixed',
          },
          processed: {
            size: blob.size,
            sizeFormatted: formatBytes(blob.size),
            type: blob.type,
            converted: true,
            compressed,
            quality: finalQuality,
          },
        },
      };

      return { success: true, error: null, image: processed };
    } catch (error) {
      console.error(error);

      this.error =
        error instanceof Error ? error.message : 'Failed to merge images.';

      return {
        success: false,
        error: this.error,
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

  /**
   * Returns the current JPGER instance status.
   */
  get status() {
    return {
      hasImage: !!this.processedImage,
      error: this.error,
    };
  }

  private async fromFile(
    file: File | Blob,
    maxSize = this.maxSize
  ): Promise<ProcessResult> {
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

      if ((isJpegWithinLimit && !this.forceCompression) || !canProcess) {
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
          backgroundColor: this.backgroundColor,
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
      this.error = null;
      this.syncPreview();

      return { success: true, error: null, image: processed };
    } catch (error) {
      console.error(error);

      this.error =
        error instanceof Error ? error.message : 'Failed to process image.';

      return {
        success: false,
        error: this.error,
      };
    } finally {
      decoded?.dispose();
    }
  }

  private async fromInput(
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
  MergeDirection,
} from './core/types.js';
