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
  let blob = await encodeToJpeg(decoded, maxQuality, options.backgroundColor);
  let finalQuality = maxQuality;
  let compressed = false;

  // Progressively reduce quality
  if (blob.size > effectiveMaxSize) {
    compressed = true;

    let currentQuality = maxQuality - compressionStep;

    while (blob.size > effectiveMaxSize && currentQuality > minQuality) {
      blob = await encodeToJpeg(
        decoded,
        currentQuality,
        options.backgroundColor
      );
      finalQuality = currentQuality;
      currentQuality -= compressionStep;
    }
  }

  return { blob, finalQuality, compressed };
};
