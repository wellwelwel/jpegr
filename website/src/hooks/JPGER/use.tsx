import type { ChangeEvent } from 'react';
import type {
  JPGEROptions,
  ProcessResult,
} from '../../../../src/core/types.js';
import type { JPGERPlaygroundViewModel, RunDebug } from '../../types.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPreviewSrc, formatBytes } from '../../../../src/core/utils.js';
import { JPGER } from '../../../../src/index.js';
import {
  buildJPGEROptions,
  getCanvasOutputStrategy,
  getUserAgent,
  revokeObjectUrl,
  RUNTIME_SUPPORT,
  validateJPGEROptions,
} from './services.js';

export const usePlayground = (): JPGERPlaygroundViewModel => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processedResult, setProcessedResult] = useState<ProcessResult | null>(
    null
  );

  // JPGER configurable options
  const [defaultMaxSizeMb, setDefaultMaxSizeMb] = useState<number>(1);
  const [maxQuality, setmaxQuality] = useState<number>(1);
  const [compressionStep, setCompressionStep] = useState<number>(0.1);
  const [minQuality, setminQuality] = useState<number>(0.1);

  // File and previews
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalObjectUrl, setOriginalObjectUrl] = useState<string | null>(
    null
  );
  const [processedObjectUrl, setProcessedObjectUrl] = useState<string | null>(
    null
  );

  // Status and debug
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lastDebug, setLastDebug] = useState<RunDebug | null>(null);

  const jpegrOptions = useMemo<Omit<JPGEROptions, 'preview'>>(
    () =>
      buildJPGEROptions({
        defaultMaxSizeMb,
        maxQuality,
        compressionStep,
        minQuality,
      }),
    [defaultMaxSizeMb, maxQuality, compressionStep, minQuality]
  );

  const jpegr = useMemo(() => new JPGER(jpegrOptions), [jpegrOptions]);

  // When the JPGER config changes, keep the selected file but invalidate the previous result (to avoid confusion).
  useEffect(() => {
    setError(null);

    setProcessedObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return null;
    });

    setLastDebug(null);
    setProcessedResult(null);

    if (selectedFile) {
      setInfo(
        'By changing configurations, click “Process” to refresh the result.'
      );
    }
  }, [jpegr, selectedFile]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      revokeObjectUrl(originalObjectUrl);
      revokeObjectUrl(processedObjectUrl);
    };
  }, [originalObjectUrl, processedObjectUrl]);

  const runProcess = async (file: File): Promise<void> => {
    const configError = validateJPGEROptions(jpegrOptions);
    if (configError) {
      setError(configError);
      return;
    }

    setIsBusy(true);
    setError(null);
    setInfo(null);

    const start = performance.now();
    const startedAtIso = new Date().toISOString();

    const result: ProcessResult = await jpegr.process(file);
    const durationMs = Math.round(performance.now() - start);

    if (result.success) {
      setProcessedResult(result);

      const processedPreview = await buildPreviewSrc(result.image.file);
      setProcessedObjectUrl((prev) => {
        revokeObjectUrl(prev);
        return processedPreview.src;
      });

      setLastDebug({
        startedAtIso,
        durationMs,
        config: {
          jpegrOptions,
        },
        inputFile: {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
        },
        output: {
          success: true,
          error: null,
          metadata: result.image.metadata.processed,
          processedBlobType: result.image.file.type,
          processedBlobSize: result.image.file.size,
          processedDataUrlLength: result.image.src.length,
        },
      });
    } else {
      setProcessedResult(null);

      setLastDebug({
        startedAtIso,
        durationMs,
        config: {
          jpegrOptions,
        },
        inputFile: {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
        },
        output: {
          success: false,
          error: result.error,
          metadata: null,
          processedBlobType: null,
          processedBlobSize: null,
          processedDataUrlLength: null,
        },
      });

      setError(result.error);
    }

    setIsBusy(false);
  };

  const onSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    const file = files[0] ?? null;
    if (!file) return;

    setError(null);
    setInfo(null);
    setLastDebug(null);
    setSelectedFile(file);

    const originalPreview = await buildPreviewSrc(file);
    setOriginalObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return originalPreview.src;
    });

    setProcessedObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return null;
    });

    setProcessedResult(null);
    await runProcess(file);
  };

  const onReset = () => {
    setError(null);
    setInfo(null);
    setLastDebug(null);
    setSelectedFile(null);
    setDefaultMaxSizeMb(1);
    setmaxQuality(1);
    setCompressionStep(0.1);
    setminQuality(0.1);

    setOriginalObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return null;
    });

    setProcessedObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return null;
    });

    setProcessedResult(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const effectiveMaxSizeBytes = jpegrOptions.maxSize ?? 0;
  const hasProcessed = processedResult?.success === true;
  const canProcess = !!selectedFile && !isBusy;
  const originalSizeText = selectedFile ? formatBytes(selectedFile.size) : '';
  const effectiveMaxSizeText = formatBytes(effectiveMaxSizeBytes);
  const finalSizeText = hasProcessed
    ? (processedResult.image.metadata.processed?.sizeFormatted ?? '—')
    : '—';

  const fileSizeText = hasProcessed
    ? formatBytes(processedResult.image.file.size)
    : '';

  const resultText = isBusy
    ? 'Processing…'
    : hasProcessed
      ? 'OK'
      : selectedFile
        ? 'No result (yet)'
        : 'Select a file';

  const convertedText = hasProcessed
    ? processedResult.image.metadata.processed?.converted
      ? 'Yes'
      : 'No'
    : '—';
  const compressedText = hasProcessed
    ? processedResult.image.metadata.processed?.compressed
      ? 'Yes'
      : 'No'
    : '—';
  const finalQualityText = hasProcessed
    ? processedResult.image.metadata.processed?.quality.toFixed(2) || '—'
    : '—';

  const onDefaultMaxSizeMbChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDefaultMaxSizeMb(Number(event.currentTarget.value));
  };

  const onmaxQualityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setmaxQuality(Number(event.currentTarget.value));
  };

  const onCompressionStepChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCompressionStep(Number(event.currentTarget.value));
  };

  const onminQualityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setminQuality(Number(event.currentTarget.value));
  };

  const onProcess = async () => {
    if (!selectedFile) return;
    await runProcess(selectedFile);
  };

  processedResult?.success && console.log(processedResult.image);

  return {
    fileInputRef,

    isBusy,
    error,
    info,

    defaultMaxSizeMb,
    maxQuality,
    compressionStep,
    minQuality,

    selectedFile,
    originalObjectUrl,
    processedObjectUrl,

    lastDebug,

    runtimeSupport: RUNTIME_SUPPORT,
    userAgent: getUserAgent(),
    canvasOutputStrategy: getCanvasOutputStrategy(RUNTIME_SUPPORT),

    originalSizeText,
    fileSizeText,

    effectiveMaxSizeText,

    resultText,
    convertedText,
    compressedText,
    finalQualityText,
    finalSizeText,

    canProcess,

    onSelectFile,
    onProcess,
    onReset,

    onDefaultMaxSizeMbChange,
    onmaxQualityChange,
    onCompressionStepChange,
    onminQualityChange,
  };
};
