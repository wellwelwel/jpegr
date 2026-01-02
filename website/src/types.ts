import type { ChangeEvent } from 'react';
import type { JPGEROptions } from '../../src/core/types.js';

export type RuntimeSupport = Readonly<{
  canvasToBlob: boolean;
  HTMLCanvasElement: boolean;
  fileReader: boolean;
  createImageBitmap: boolean;
}>;

export type JPGERPlaygroundViewModel = Readonly<{
  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  // State
  isBusy: boolean;
  error: string | null;
  info: string | null;

  defaultMaxSizeMb: number;
  maxQuality: number;
  compressionStep: number;
  minQuality: number;

  selectedFile: File | null;
  originalObjectUrl: string | null;
  processedObjectUrl: string | null;

  lastDebug: RunDebug | null;

  // Fixed runtime info
  runtimeSupport: RuntimeSupport;
  userAgent: string;
  canvasOutputStrategy: boolean;

  // Derived display values
  originalSizeText: string;
  processedSizeText: string;

  effectiveMaxSizeText: string;

  resultText: string;
  convertedText: string;
  compressedText: string;
  finalQualityText: string;
  finalSizeText: string;

  canProcess: boolean;

  // Handlers
  onSelectFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onProcess: () => Promise<void>;
  onReset: () => void;
  onDefaultMaxSizeMbChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onmaxQualityChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompressionStepChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onminQualityChange: (event: ChangeEvent<HTMLInputElement>) => void;
}>;

export type RunDebug = Readonly<{
  startedAtIso: string;
  durationMs: number;
  config: Readonly<{
    jpegrOptions: Omit<Required<JPGEROptions>, 'preview'>;
  }>;
  inputFile: Readonly<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
  }>;
  output: Readonly<{
    success: boolean;
    error: string | null;
    metadata: unknown | null;
    processedBlobType: string | null;
    processedBlobSize: number | null;
    processedDataUrlLength: number | null;
  }>;
}>;
