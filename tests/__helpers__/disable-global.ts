import type { FEATURES_TO_DISABLE } from '../e2e/compression-hash-fallbacks.spec';

export const disableGlobal = (
  featureName: (typeof FEATURES_TO_DISABLE)[number]
): string => {
  switch (featureName) {
    case 'createImageBitmap':
      return 'delete window.createImageBitmap;';
    case 'Blob':
      return 'delete window.Blob; HTMLCanvasElement.prototype.toBlob = undefined; URL.createObjectURL = undefined; URL.revokeObjectURL = undefined;';
    case 'File':
      return 'delete window.File; URL.createObjectURL = undefined; URL.revokeObjectURL = undefined;';
    case 'createObjectURL':
      return 'URL.createObjectURL = undefined; URL.revokeObjectURL = undefined;';
    case 'toBlob':
      return 'HTMLCanvasElement.prototype.toBlob = undefined;';
    default:
      return '';
  }
};
