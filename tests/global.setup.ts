import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

export default async () => {
  const tmpDir = join(__dirname, '__tmp__');

  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
};
