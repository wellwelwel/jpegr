import type { FEATURES_TO_TEST } from '../e2e/compression-hash-fallbacks.spec';

type FeatureName = (typeof FEATURES_TO_TEST)[number];

/**
 * Generates a script that disables a specific browser feature.
 */
export const disableGlobal = (featureName: FeatureName): string => {
  switch (featureName) {
    case 'createImageBitmap':
      return 'delete window.createImageBitmap;';
    case 'Blob':
      return 'delete window.Blob;';
    case 'File':
      return 'delete window.File;';
    case 'createObjectURL':
      return 'URL.createObjectURL = undefined; URL.revokeObjectURL = undefined;';
    case 'toBlob':
      return 'HTMLCanvasElement.prototype.toBlob = undefined;';
    default:
      return '';
  }
};
