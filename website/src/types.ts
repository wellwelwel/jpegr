import type { ChangeEvent } from 'react';
import type { JPGEROptions, RuntimeSupport } from '../../src/core/types.js';

export type JPGERPlaygroundViewModel = {
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
  forceCompression: boolean;

  selectedFile: File | Blob | null;
  objectUrl: string | null;
  processedObjectUrl: string | null;

  lastDebug: RunDebug | null;

  // Runtime info
  runtimeSupport: RuntimeSupport;
  userAgent: string;
  canvasOutputStrategy: boolean;

  // Derived display values
  originalSizeText: string;
  fileSizeText: string;

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
  onForceCompressionChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type RunDebug = {
  startedAtIso: string;
  durationMs: number;
  config: {
    jpegrOptions: Omit<JPGEROptions, 'preview'>;
  };
  inputFile: {
    name: string;
    type: string;
    size: number;
    lastModified: number;
  };
  output: {
    success: boolean;
    error: string | null;
    metadata: unknown | null;
    processedBlobType: string | null;
    processedBlobSize: number | null;
    processedDataUrlLength: number | null;
  };
};

export type Status = {
  isBusy: boolean;
  error: string | null;
  info: string | null;
  lastDebug: RunDebug | null;
};
