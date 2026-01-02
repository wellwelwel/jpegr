import type {
  CompressionOptions,
  CompressionResult,
  DecodedImage,
} from './types.js';
import { encodeToJpeg } from './encoder.js';

/**
 * Compresses an image to fit within size constraints.
 *
 * Algorithm:
 * 1. Try encoding at max quality
 * 2. If too large, reduce quality by step until it fits or min quality reached
 */
export const compressToFit = async (
  decoded: DecodedImage,
  options: CompressionOptions
): Promise<CompressionResult> => {
  const { maxSize, maxQuality, minQuality, compressionStep } = options;

  // First attempt at max quality
  let blob = await encodeToJpeg(decoded, maxQuality);
  let finalQuality = maxQuality;
  let wasCompressed = false;

  // Progressively reduce quality if needed
  if (blob.size > maxSize) {
    wasCompressed = true;
    let currentQuality = maxQuality - compressionStep;

    while (blob.size > maxSize && currentQuality >= minQuality) {
      blob = await encodeToJpeg(decoded, currentQuality);
      finalQuality = currentQuality;
      currentQuality -= compressionStep;
    }
  }

  return { blob, finalQuality, wasCompressed };
};
