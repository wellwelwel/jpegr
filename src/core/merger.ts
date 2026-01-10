import type {
  DecodedImage,
  MergedImageResult,
  MergeDirection,
  MergeOptions,
} from './types.js';
import { decodeImage } from './decoder.js';
import { canvasToFile, validateHexColor } from './encoder.js';

const calculateDimensions = (
  images: DecodedImage[],
  direction: MergeDirection
): { width: number; height: number } => {
  if (direction === 'horizontal') {
    const totalWidth = images.reduce((sum, img) => sum + img.width, 0);
    const maxHeight = Math.max(...images.map((img) => img.height));

    return { width: totalWidth, height: maxHeight };
  }

  const maxWidth = Math.max(...images.map((img) => img.width));
  const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

  return { width: maxWidth, height: totalHeight };
};

const drawImagesOnCanvas = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  images: DecodedImage[],
  direction: MergeDirection,
  backgroundColor: string
): void => {
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  let offsetX = 0;
  let offsetY = 0;

  for (const image of images) {
    context.drawImage(
      image.source,
      offsetX,
      offsetY,
      image.width,
      image.height
    );

    if (direction === 'horizontal') {
      offsetX += image.width;
      continue;
    }

    offsetY += image.height;
  }
};

export const mergeImages = async (
  sources: (File | Blob)[],
  options: MergeOptions
): Promise<MergedImageResult> => {
  const { direction, quality = 1, backgroundColor = '#000000' } = options;

  if (!sources || sources.length === 0)
    throw new Error('At least one image source is required for merging.');

  if (direction !== 'horizontal' && direction !== 'vertical')
    throw new Error('Invalid direction. Expected "horizontal" or "vertical".');

  if (validateHexColor(backgroundColor) === false)
    throw new Error(
      `Invalid background color: "${backgroundColor}". Expected a hex color string like "#000" or "#000000", for example.`
    );

  const decodedImages: DecodedImage[] = [];

  try {
    for (const source of sources) {
      const decoded = await decodeImage(source);

      decodedImages.push(decoded);
    }

    const dimensions = calculateDimensions(decodedImages, direction);
    const canvas = document.createElement('canvas');

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not supported');

    drawImagesOnCanvas(
      canvas,
      context,
      decodedImages,
      direction,
      backgroundColor
    );

    const file = await canvasToFile(canvas, quality);

    return {
      file,
      width: dimensions.width,
      height: dimensions.height,
    };
  } finally {
    for (const decoded of decodedImages) decoded?.dispose();
  }
};
