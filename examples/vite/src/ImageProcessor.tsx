import type { ProcessResult } from 'jpegr';
import type { ChangeEvent } from 'react';
import { JPGER } from 'jpegr';
import { useRef, useState } from 'react';

export const ImageProcessor = () => {
  const { current: jpegr } = useRef(new JPGER());
  const [result, setResult] = useState<ProcessResult | null>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    jpegr.process(event.currentTarget).then((data) => {
      if (!data.success) jpegr.clear();
      setResult(data);
    });
  };

  return (
    <>
      <input type='file' accept='image/*' onChange={onChange} />
      {result?.image && (
        <img src={result.image.src} alt='Selected image preview' />
      )}
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </>
  );
};
