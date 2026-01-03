import type {
  JPGEROptions,
  RuntimeSupport,
} from '../../../../src/core/types.js';
import { JPGER } from '../../../../src/index.js';

const BYTES_IN_KIB = 1024;
const BYTES_IN_MIB = BYTES_IN_KIB * BYTES_IN_KIB;

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const mbToBytes = (mb: number): number => {
  const safeMb = clampNumber(mb, 0.01, 10_000);
  const bytes = Math.round((safeMb + Number.EPSILON) * BYTES_IN_MIB);

  return Math.max(1, bytes);
};

export const tryPrettifyBody = (body: string): string => {
  const trimmed = body.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
};

export const RUNTIME_SUPPORT = JPGER.getRuntimeSupport();

export const getUserAgent = (): string => {
  if (typeof navigator === 'undefined') return 'N/A';

  return typeof navigator.userAgent === 'string'
    ? navigator.userAgent.trim() || 'N/A'
    : 'N/A';
};

export const getCanvasOutputStrategy = (support: RuntimeSupport): boolean =>
  support.canvasToBlob;

export const buildJPGEROptions = (input: {
  defaultMaxSizeMb: number;
  maxQuality: number;
  compressionStep: number;
  minQuality: number;
}): Omit<Required<JPGEROptions>, 'preview'> => {
  const normalizedDefaultMaxSizeMb = clampNumber(
    input.defaultMaxSizeMb,
    0.01,
    200
  );

  const normalizedmaxQuality = clampNumber(input.maxQuality, 0.1, 1);

  const normalizedCompressionStep = clampNumber(
    input.compressionStep,
    0.01,
    0.5
  );

  const normalizedMinQuality = clampNumber(input.minQuality, 0.01, 1);

  return {
    maxSize: mbToBytes(normalizedDefaultMaxSizeMb),
    maxQuality: normalizedmaxQuality,
    compressionStep: normalizedCompressionStep,
    minQuality: normalizedMinQuality,
  };
};

export const validateJPGEROptions = (
  options: Omit<Required<JPGEROptions>, 'preview'>
): string | null => {
  if (options.maxQuality < options.minQuality)
    return 'Invalid config: maxQuality cannot be lower than minQuality.';

  if (options.compressionStep <= 0)
    return 'Invalid config: compressionStep must be greater than 0.';

  return null;
};

export const revokeObjectUrl = (url: string | null): void => {
  try {
    if (url) URL.revokeObjectURL(url);
  } catch (error) {}
};
