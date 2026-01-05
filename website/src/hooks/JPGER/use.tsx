import type { ChangeEvent } from 'react';
import type { JPGEROptions, ProcessResult } from '../../../../src/index.js';
import type { JPGERPlaygroundViewModel, Status } from '../../types.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPreviewSrc, formatBytes } from '../../../../src/core/utils.js';
import { JPGER } from '../../../../src/index.js';
import { DEFAULT_OPTIONS } from './configs.js';
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

  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessResult | null>(null);
  const [status, setStatus] = useState<Status>({
    isBusy: false,
    error: null,
    info: null,
    lastDebug: null,
  });

  const jpegrOptions = useMemo<Omit<JPGEROptions, 'preview'>>(
    () =>
      buildJPGEROptions({
        defaultMaxSizeMb: options.defaultMaxSizeMb,
        maxQuality: options.maxQuality,
        compressionStep: options.compressionStep,
        minQuality: options.minQuality,
        forceCompression: options.forceCompression,
      }),
    [options]
  );

  const jpegr = useMemo(() => new JPGER(jpegrOptions), [jpegrOptions]);

  const processedObjectUrl = results?.image?.src ?? null;

  // When the JPGER config changes, keep the selected file but invalidate the previous result (to avoid confusion).
  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      error: null,
      lastDebug: null,
      info: selectedFile
        ? 'By changing configurations, click "Process" to refresh the result.'
        : null,
    }));

    jpegr.clear();
    setResults(null);
  }, [jpegr, jpegrOptions, selectedFile]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      revokeObjectUrl(objectUrl);
    };
  }, [objectUrl]);

  const runProcess = async (file: File | Blob): Promise<void> => {
    const configError = validateJPGEROptions(jpegrOptions);
    if (configError) {
      setStatus((prev) => ({ ...prev, error: configError }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      isBusy: true,
      error: null,
      info: null,
    }));

    const start = performance.now();
    const startedAtIso = new Date().toISOString();

    const result: ProcessResult = await jpegr.process(file);
    const durationMs = Math.round(performance.now() - start);

    if (result.success) {
      setResults(result);
      setStatus((prev) => ({
        ...prev,
        lastDebug: {
          startedAtIso,
          durationMs,
          config: {
            jpegrOptions,
          },
          inputFile: {
            name:
              'name' in file && typeof file.name === 'string'
                ? file.name
                : 'unknown',
            lastModified:
              'lastModified' in file && typeof file.lastModified === 'number'
                ? file.lastModified
                : 0,
            type: file.type,
            size: file.size,
          },
          output: {
            success: true,
            error: null,
            metadata: result.image!.metadata.processed,
            processedBlobType: result.image!.file.type,
            processedBlobSize: result.image!.file.size,
            processedDataUrlLength: result.image!.src.length,
          },
        },
      }));
    } else {
      setResults(null);

      setStatus((prev) => ({
        ...prev,
        lastDebug: {
          startedAtIso,
          durationMs,
          config: {
            jpegrOptions,
          },
          inputFile: {
            name:
              'name' in file && typeof file.name === 'string'
                ? file.name
                : 'unknown',
            lastModified:
              'lastModified' in file && typeof file.lastModified === 'number'
                ? file.lastModified
                : 0,
            type: file.type,
            size: file.size,
          },
          output: {
            success: false,
            error: result.error!,
            metadata: null,
            processedBlobType: null,
            processedBlobSize: null,
            processedDataUrlLength: null,
          },
        },
        error: result.error!,
      }));
    }

    setStatus((prev) => ({ ...prev, isBusy: false }));
  };

  const onSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    const file = files[0] ?? null;
    if (!file) return;

    setStatus((prev) => ({
      ...prev,
      error: null,
      info: null,
      lastDebug: null,
    }));
    setSelectedFile(file);

    const originalPreview = await buildPreviewSrc(file);
    setObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return originalPreview.src;
    });

    jpegr.clear();
    setResults(null);
    await runProcess(file);
  };

  const onReset = () => {
    setStatus({
      isBusy: false,
      error: null,
      info: null,
      lastDebug: null,
    });
    setSelectedFile(null);
    setOptions(DEFAULT_OPTIONS);

    setObjectUrl((prev) => {
      revokeObjectUrl(prev);
      return null;
    });

    jpegr.clear();
    setResults(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const effectiveMaxSizeBytes = jpegrOptions.maxSize ?? 0;
  const hasProcessed = results?.success === true;
  const canProcess = !!selectedFile && !status.isBusy;
  const originalSizeText = selectedFile ? formatBytes(selectedFile.size) : '';
  const effectiveMaxSizeText = formatBytes(effectiveMaxSizeBytes);
  const finalSizeText = hasProcessed
    ? (results.image!.metadata.processed?.sizeFormatted ?? '—')
    : '—';

  const fileSizeText = hasProcessed
    ? formatBytes(results.image!.file.size)
    : '';
  const resultText = status.isBusy
    ? 'Processing…'
    : hasProcessed
      ? 'OK'
      : selectedFile
        ? 'No result (yet)'
        : 'Select a file';

  const convertedText = hasProcessed
    ? results.image!.metadata.processed?.converted
      ? 'Yes'
      : 'No'
    : '—';
  const compressedText = hasProcessed
    ? results.image!.metadata.processed?.compressed
      ? 'Yes'
      : 'No'
    : '—';
  const finalQualityText = hasProcessed
    ? results.image!.metadata.processed?.quality.toFixed(2) || '—'
    : '—';

  const onDefaultMaxSizeMbChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      defaultMaxSizeMb: Number(event.currentTarget.value),
    }));
  };

  const onmaxQualityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      maxQuality: Number(event.currentTarget.value),
    }));
  };

  const onCompressionStepChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      compressionStep: Number(event.currentTarget.value),
    }));
  };

  const onminQualityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      minQuality: Number(event.currentTarget.value),
    }));
  };

  const onForceCompressionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      forceCompression: event.target.checked,
    }));
  };

  const onProcess = async () => {
    if (!selectedFile) return;
    await runProcess(selectedFile);
  };
  results?.success && console.log(results.image);

  return {
    fileInputRef,

    isBusy: status.isBusy,
    error: status.error,
    info: status.info,

    defaultMaxSizeMb: options.defaultMaxSizeMb,
    maxQuality: options.maxQuality,
    compressionStep: options.compressionStep,
    minQuality: options.minQuality,
    forceCompression: options.forceCompression,

    selectedFile,
    objectUrl,
    processedObjectUrl,

    lastDebug: status.lastDebug,

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
    onForceCompressionChange,
  };
};
