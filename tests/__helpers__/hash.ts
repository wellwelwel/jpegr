import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/**
 * Computes the SHA-256 hash of a file.
 */
export const computeFileHash = async (filePath: string): Promise<string> => {
  const buffer = await readFile(filePath);
  const hash = createHash('sha256');

  hash.update(buffer);

  return hash.digest('hex');
};
