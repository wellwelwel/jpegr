import { usePlayground } from './hooks/JPGER/use.jsx';
import './css/styles.scss';

export const ImagePreview = () => {
  const {
    canProcess,
    canvasOutputStrategy,
    compressedText,
    compressionStep,
    convertedText,
    defaultMaxSizeMb,
    effectiveMaxSizeText,
    error,
    fileInputRef,
    finalQualityText,
    finalSizeText,
    info,
    isBusy,
    lastDebug,
    maxQuality,
    minQuality,
    onCompressionStepChange,
    onDefaultMaxSizeMbChange,
    onmaxQualityChange,
    onminQualityChange,
    onProcess,
    onReset,
    onSelectFile,
    originalObjectUrl,
    originalSizeText,
    processedObjectUrl,
    fileSizeText,
    resultText,
    runtimeSupport,
    selectedFile,
    userAgent,
  } = usePlayground();

  const badgeClass = (isOk: boolean) =>
    `jpegr-badge ${isOk ? 'jpegr-badge--ok' : 'jpegr-badge--no'}`;

  return (
    <div className='jpegr-page'>
      <header className='jpegr-header'>
        <h1 className='jpegr-title'>JPGER Playground</h1>
        <p className='jpegr-subtitle'>
          Select an image, adjust the <code className='jpegr-mono'>JPGER</code>{' '}
          options, and view the full processing output.
        </p>
      </header>

      <div className='jpegr-grid'>
        <section className='jpegr-card'>
          <h2 className='jpegr-cardTitle'>File and processing</h2>

          <div className='jpegr-field jpegr-field--mt12'>
            <label className='jpegr-label' htmlFor='file'>
              Select image
            </label>
            <input
              ref={fileInputRef}
              id='file'
              type='file'
              accept='image/*'
              onChange={onSelectFile}
              disabled={isBusy}
              className='jpegr-input jpegr-input--file'
            />
          </div>

          <div className='jpegr-actions'>
            <button
              type='button'
              onClick={onProcess}
              disabled={!canProcess}
              className='jpegr-button'
            >
              Process
            </button>

            <button
              type='button'
              onClick={onReset}
              disabled={isBusy}
              className='jpegr-button jpegr-button--danger'
            >
              Reset
            </button>

            {processedObjectUrl && (
              <a
                href={processedObjectUrl}
                download='image.jpeg'
                className='jpegr-button'
              >
                Download processed JPEG
              </a>
            )}
          </div>

          <div className='jpegr-previewGrid'>
            <div className='jpegr-previewBox'>
              <div className='jpegr-previewHeader'>
                <p className='jpegr-previewTitle'>Original</p>
                <span className='jpegr-smallHint'>{originalSizeText}</span>
              </div>

              {originalObjectUrl ? (
                <img
                  className='jpegr-img'
                  src={originalObjectUrl}
                  alt='Original preview'
                />
              ) : (
                <div className='jpegr-previewBody'>
                  <p className='jpegr-previewEmpty'>No image selected.</p>
                </div>
              )}
            </div>

            <div className='jpegr-previewBox'>
              <div className='jpegr-previewHeader'>
                <p className='jpegr-previewTitle'>Processed (JPEG)</p>
                <span className='jpegr-smallHint'>{fileSizeText}</span>
              </div>

              {processedObjectUrl ? (
                <img
                  className='jpegr-img'
                  src={processedObjectUrl}
                  alt='Processed preview'
                />
              ) : (
                <div className='jpegr-previewBody'>
                  <p className='jpegr-previewEmpty'>
                    {selectedFile
                      ? 'No processed output yet.'
                      : 'Select an image to generate output.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className='jpegr-kv'>
            <div className='jpegr-k'>
              Max size: <span className='jpegr-v'>{effectiveMaxSizeText}</span>
            </div>

            <div className='jpegr-k'>
              Result: <span className='jpegr-v'>{resultText}</span>
            </div>

            <div className='jpegr-k'>
              Converted: <span className='jpegr-v'>{convertedText}</span>
            </div>

            <div className='jpegr-k'>
              Compressed: <span className='jpegr-v'>{compressedText}</span>
            </div>

            <div className='jpegr-k'>
              Final quality: <span className='jpegr-v'>{finalQualityText}</span>
            </div>

            <div className='jpegr-k'>
              Final size: <span className='jpegr-v'>{finalSizeText}</span>
            </div>
          </div>

          {error && <div className='jpegr-messageError'>{error}</div>}
          {info && <div className='jpegr-messageInfo'>{info}</div>}
        </section>

        <aside className='jpegr-aside'>
          <section className='jpegr-card'>
            <h2 className='jpegr-cardTitle'>JPGER options</h2>

            <div className='jpegr-row'>
              <div className='jpegr-field'>
                <label className='jpegr-label'>defaultMaxSize (MB)</label>
                <input
                  type='number'
                  min={0.01}
                  step={0.1}
                  value={defaultMaxSizeMb}
                  onChange={onDefaultMaxSizeMbChange}
                  disabled={isBusy}
                  className='jpegr-input'
                />
              </div>

              <div className='jpegr-field'>
                <label className='jpegr-label'>maxQuality (0.1 - 1.0)</label>
                <input
                  type='number'
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={maxQuality}
                  onChange={onmaxQualityChange}
                  disabled={isBusy}
                  className='jpegr-input'
                />
              </div>

              <div className='jpegr-field'>
                <label className='jpegr-label'>compressionStep</label>
                <input
                  type='number'
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  value={compressionStep}
                  onChange={onCompressionStepChange}
                  disabled={isBusy}
                  className='jpegr-input'
                />
              </div>

              <div className='jpegr-field'>
                <label className='jpegr-label'>minQuality</label>
                <input
                  type='number'
                  min={0.01}
                  max={1}
                  step={0.01}
                  value={minQuality}
                  onChange={onminQualityChange}
                  disabled={isBusy}
                  className='jpegr-input'
                />
              </div>
            </div>
          </section>

          <section className='jpegr-card'>
            <h2 className='jpegr-cardTitle'>Debug (JSON)</h2>

            <pre className='jpegr-pre'>
              {lastDebug ? JSON.stringify(lastDebug, null, 2) : 'No runs yet.'}
            </pre>
          </section>

          <section className='jpegr-card'>
            <div className='jpegr-cardTitleRow'>
              <h2 className='jpegr-cardTitle'>Browser support</h2>
            </div>

            <div className='jpegr-kv'>
              <div className='jpegr-k'>HTMLCanvasElement</div>
              <div className='jpegr-v'>
                <span className={badgeClass(runtimeSupport.HTMLCanvasElement)}>
                  {runtimeSupport.HTMLCanvasElement
                    ? 'Supported'
                    : 'Not supported'}
                </span>
              </div>

              <div className='jpegr-k'>FileReader</div>
              <div className='jpegr-v'>
                <span className={badgeClass(runtimeSupport.FileReader)}>
                  {runtimeSupport.FileReader ? 'Supported' : 'Not supported'}
                </span>
              </div>

              <div className='jpegr-k'>createImageBitmap</div>
              <div className='jpegr-v'>
                <span className={badgeClass(runtimeSupport.createImageBitmap)}>
                  {runtimeSupport.createImageBitmap
                    ? 'Supported'
                    : 'Not supported'}
                </span>
              </div>

              <div className='jpegr-k'>Blob</div>
              <div className='jpegr-v'>
                <span className={badgeClass(runtimeSupport.Blob)}>
                  {runtimeSupport.Blob ? 'Supported' : 'Not supported'}
                </span>
              </div>

              <div className='jpegr-k'>File</div>
              <div className='jpegr-v'>
                <span className={badgeClass(runtimeSupport.File)}>
                  {runtimeSupport.File ? 'Supported' : 'Not supported'}
                </span>
              </div>

              <div className='jpegr-k'>createObjectURL</div>
              <div className='jpegr-v'>
                <span className={badgeClass(runtimeSupport.createObjectURL)}>
                  {runtimeSupport.createObjectURL
                    ? 'Supported'
                    : 'Not supported'}
                </span>
              </div>

              <div className='jpegr-k'>Canvas API</div>
              <div className='jpegr-v'>
                <span className={badgeClass(canvasOutputStrategy)}>
                  {canvasOutputStrategy ? 'Modern' : 'Legacy'}
                </span>
              </div>
            </div>

            <p className='jpegr-smallHint jpegr-smallHint--mt10'>
              User agent (for reference):
            </p>
            <div className='jpegr-preSmall jpegr-mono'>{userAgent}</div>
          </section>
        </aside>
      </div>
    </div>
  );
};
