import path from 'node:path';
import { expect, test } from '@playwright/test';
import { computeFileHash } from '../__helpers__/hash.js';
import { EXPECTED_HASHES, TEST_IMAGES } from '../__snapshots__/hashes.js';

test.describe('Hash consistency', () => {
  for (const testImage of TEST_IMAGES) {
    test(`should produce consistent hash for ${testImage.name}`, async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const fileInput = page.locator('#file');
      await expect(fileInput).toBeVisible();

      if (testImage.name === 'force-compression.jpeg') {
        const forceCompressionCheckbox = page.locator(
          'input[type="checkbox"]#force-compression'
        );

        await forceCompressionCheckbox.check({ force: true });
      }

      if (testImage.name === 'background-color.png') {
        const backgroundColorInput = page.locator(
          'input[type="color"]#background-color'
        );

        await backgroundColorInput.fill('#693bfe');
      }

      await fileInput.setInputFiles(testImage.path);

      const processButton = page.locator('button:has-text("Process")');
      await processButton.click();

      const downloadButton = page.locator(
        'a:has-text("Download processed JPEG")'
      );
      await expect(downloadButton).toBeVisible({ timeout: 10000 });

      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();

      const download = await downloadPromise;
      const downloadPath = path.join(
        __dirname,
        `../__tmp__/${browserName}/${testImage.name}.processed.jpeg`
      );

      await download.saveAs(downloadPath);

      const actualHash = await computeFileHash(downloadPath);
      const expectedHash = EXPECTED_HASHES[testImage.name]?.[browserName];

      expect(actualHash).toBe(expectedHash);
    });
  }
});
