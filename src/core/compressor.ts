import type {
  CompressionOptions,
  CompressionResult,
  DecodedImage,
} from './types.js';
import { encodeToJpeg } from './encoder.js';

export const compressToFit = async (
  decoded: DecodedImage,
  options: CompressionOptions
): Promise<CompressionResult> => {
  const { maxSize, originalSize, maxQuality, minQuality, compressionStep } =
    options;
  const effectiveMaxSize = Math.min(maxSize, originalSize);

  // First attempt at max quality
  let blob = await encodeToJpeg(decoded, maxQuality);
  let finalQuality = maxQuality;
  let wasCompressed = false;

  // Progressively reduce quality
  if (blob.size > effectiveMaxSize) {
    wasCompressed = true;

    let currentQuality = maxQuality - compressionStep;

    while (blob.size > effectiveMaxSize && currentQuality > minQuality) {
      blob = await encodeToJpeg(decoded, currentQuality);
      finalQuality = currentQuality;
      currentQuality -= compressionStep;
    }
  }

  return { blob, finalQuality, wasCompressed };
};
