import type { PlaywrightWorkerOptions } from '@playwright/test';
import path from 'node:path';
import { env } from 'node:process';

type Hashes = Record<
  string,
  Record<PlaywrightWorkerOptions['browserName'], string>
>;

const isCI = !!env.CI;
const original =
  'af43a8a243ade71dfd94126b4bac776a39260b2d4ded84cc833fc8653e52eb5b';

export const EXPECTED_HASHES: Hashes = {
  'no-compress-and-no-convert.jpeg': {
    chromium: original,
    firefox: original,
    webkit: original,
  },
  'compressed-webp-image.webp': {
    chromium:
      '4fd7940c8e686810373f9bf35d9b26012749c2d402a45c01cb43a21bed10de76',
    firefox: '6374d54c828360403333227876205bb9b6783338863918e3cfee4692c2303723',
    webkit: isCI
      ? '4fd7940c8e686810373f9bf35d9b26012749c2d402a45c01cb43a21bed10de76'
      : 'bbf2d16df90424b92849438d47bd3ae849ea2933c917c28b33573b49a451fd3a',
  },
  'non-compressed-png-image.png': {
    chromium:
      '655f0ae5f9e2b98d694e9e5e6775f6c28a53c970fbb84e1514d4676e509d5b68',
    firefox: '41442c9e4622685bd443cf5253f977e7b89211f6afe5a961488e6ae519ca5989',
    webkit: isCI
      ? '9a4d4e9cceef3a3d9c67d0c3c0f8e1f4a8ad7b4e29c78ff10bac2cd0c1f3b789'
      : 'a2954ccfc7ea7c5d3d513d1c6c3f1e94b6fa6310040cf4534966c2e56dac5c77',
  },
};

export const TEST_IMAGES = Object.keys(EXPECTED_HASHES).map((name) => ({
  name,
  path: path.resolve(__dirname, `../__resources__/${name}`),
}));
