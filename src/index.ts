import type {
  JPGEROptions,
  ProcessedImage,
  ProcessedImageMetadata,
  ProcessResult,
} from './types';

const BYTES_IN_KIB = 1024;
const DEFAULT_MAX_SIZE_BYTES = 1 * BYTES_IN_KIB * BYTES_IN_KIB;
const DEFAULT_QUALITY = 1;
const COMPRESSION_STEP = 0.1;
const MIN_COMPRESSION_QUALITY = 0.1;

/**
 * **JPGER** - Module for processing images in the browser.
 *
 * - Converts any image to JPEG with automatic compression.
 * - Compatible with older browsers through fallbacks.
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

    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE_BYTES;
    this.maxQuality = options.maxQuality ?? DEFAULT_QUALITY;
    this.compressionStep = options.compressionStep ?? COMPRESSION_STEP;
    this.minQuality = options.minQuality ?? MIN_COMPRESSION_QUALITY;

    this.syncPreview();
  }

  /**
   * Returns the processed image (read-only)
   */
  get image(): ProcessedImage | null {
    return this.processedImage;
  }

  /**
   * Returns the processed file size in bytes
   */
  get fileSize(): number {
    return this.processedImage?.blob.size ?? 0;
  }

  /**
   * Returns the formatted size (KB or MB)
   */
  get fileSizeFormatted(): string {
    const bytes = this.fileSize;

    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Indicates whether the image was converted from another format to JPEG
   */
  get wasConverted(): boolean {
    return this.processedImage?.metadata.wasConverted ?? false;
  }

  /**
   * Indicates whether it was necessary to apply additional compression
   */
  get wasCompressed(): boolean {
    return this.processedImage?.metadata.wasCompressed ?? false;
  }

  /**
   * Returns the applied compression quality (0.1 to 1.0)
   */
  get compressionQuality(): number {
    return this.processedImage?.metadata.compressionQuality ?? this.maxQuality;
  }

  /**
   * Returns the full metadata for the processed image
   */
  get metadata(): ProcessedImageMetadata | null {
    return this.processedImage?.metadata ?? null;
  }

  /**
   * Clears the processed image from memory
   */
  clear(): void {
    this.processedImage = null;
    this.syncPreview();
  }

  /**
   * Processes an image from a file input element
   */
  async fromInput(
    inputElement: HTMLInputElement,
    maxSizeBytes = this.maxSize
  ): Promise<ProcessResult> {
    const file = inputElement.files?.[0];
    if (!file) return { success: false, error: 'No file selected.' };

    return this.fromFile(file, maxSizeBytes);
  }

  /**
   * Processes an image file
   */
  async fromFile(
    file: File,
    maxSizeBytes = this.maxSize
  ): Promise<ProcessResult> {
    try {
      const dataUrl = await this.fileToDataUrl(file);
      const image = await this.loadImage(dataUrl);
      const originalSize = file.size;
      const originalType = file.type;

      let processedBlob: Blob;
      let wasConverted = false;
      let wasCompressed = false;
      let finalQuality = this.maxQuality;

      const isJpegWithinLimit =
        file.type === 'image/jpeg' && file.size <= maxSizeBytes;

      if (isJpegWithinLimit) {
        processedBlob = file;
      } else {
        wasConverted = file.type !== 'image/jpeg';
        processedBlob = await this.convertToJpeg(image, this.maxQuality);

        if (processedBlob.size > maxSizeBytes) {
          wasCompressed = true;
          let currentQuality = this.maxQuality - this.compressionStep;

          while (
            processedBlob.size >= maxSizeBytes &&
            currentQuality >= this.minQuality
          ) {
            processedBlob = await this.convertToJpeg(image, currentQuality);
            finalQuality = currentQuality;
            currentQuality -= this.compressionStep;
          }
        }
      }

      const processedDataUrl = await this.blobToDataUrl(processedBlob);
      const processed: ProcessedImage = Object.freeze({
        blob: processedBlob,
        dataUrl: processedDataUrl,
        metadata: Object.freeze({
          originalSize,
          originalType,
          processedSize: processedBlob.size,
          wasConverted,
          wasCompressed,
          compressionQuality: finalQuality,
        }),
      });

      this.processedImage = processed;
      this.syncPreview();

      return { success: true, image: processed };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error while processing the image.',
      };
    }
  }

  /**
   * Uploads the processed image to the backend
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
    } = options || Object.create(null);

    const formData = new FormData();
    formData.append(field, this.processedImage.blob, name);

    const response = await fetch(url, {
      ...init,
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image to the server');

    return response;
  }

  // ========================================
  // Private preview sync
  // ========================================

  private syncPreview(): void {
    const target = this.previewElement;
    if (!target) return;

    if (!this.processedImage) {
      target.removeAttribute('src');
      target.removeAttribute('srcset');
      target.alt = '';
      return;
    }

    target.src = this.processedImage.dataUrl;
    target.alt = 'Selected image preview';
  }

  // ========================================
  // Private conversion methods
  // ========================================

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Failed to read file'));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Failed to convert blob'));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error('The selected file is not a valid image.'));
      image.src = source;
    });
  }

  private convertToJpeg(
    image: HTMLImageElement,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const canvasContext = canvas.getContext('2d');
        if (!canvasContext) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Black background for transparency (JPEG does not support alpha)
        canvasContext.fillStyle = '#000000';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(image, 0, 0);

        this.canvasToBlob(canvas, quality).then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    quality: number
  ): Promise<Blob> {
    if (typeof canvas.toBlob === 'function')
      return this.canvasToBlobModern(canvas, quality);

    return Promise.resolve(this.canvasToBlobLegacy(canvas, quality));
  }

  private canvasToBlobModern(
    canvas: HTMLCanvasElement,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          blob ? resolve(blob) : reject(new Error('Failed to convert image'));
        },
        'image/jpeg',
        quality
      );
    });
  }

  private canvasToBlobLegacy(canvas: HTMLCanvasElement, quality: number): Blob {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    return this.dataUrlToBlob(dataUrl);
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const base64Content = parts[1];
    const mimeType = parts[0].split(':')[1].split(';')[0];
    const decodedContent = atob(base64Content);
    const arrayBuffer = new ArrayBuffer(decodedContent.length);
    const byteArray = new Uint8Array(arrayBuffer);

    for (let byteIndex = 0; byteIndex < decodedContent.length; byteIndex++)
      byteArray[byteIndex] = decodedContent.charCodeAt(byteIndex);

    return new Blob([arrayBuffer], { type: mimeType });
  }
}
