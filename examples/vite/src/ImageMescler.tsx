import type { MergeDirection, ProcessResult } from 'jpegr';
import type { ChangeEvent } from 'react';
import { JPGER } from 'jpegr';
import { useRef, useState } from 'react';

export const ImageMescler = () => {
  const { current: jpegr } = useRef(new JPGER());
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [direction, setDirection] = useState<MergeDirection>('vertical');

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) {
      jpegr.clear();
      return;
    }

    const merged = await jpegr.merge(Array.from(files), direction);
    setResult(merged);
  };

  const onDirectionChange = (newDirection: MergeDirection) => {
    if (inputRef.current) inputRef.current.value = '';

    jpegr.clear();
    setDirection(newDirection);
    setResult(null);
  };

  return (
    <>
      <div>
        <label>
          Direction:{' '}
          <select
            value={direction}
            onChange={(e) =>
              onDirectionChange(e.target.value as MergeDirection)
            }
          >
            <option value='horizontal'>Horizontal</option>
            <option value='vertical'>Vertical</option>
          </select>
        </label>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        onChange={onChange}
      />
      {result?.image && (
        <img src={result.image.src} alt='Merged image preview' />
      )}
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </>
  );
};
