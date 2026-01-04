import type { ProcessResult } from 'jpegr';
import type { ChangeEvent } from 'react';
import { JPGER } from 'jpegr';
import { useRef, useState } from 'react';

export const ImagePreview = () => {
  const { current: jpegr } = useRef(new JPGER());
  const [state, setState] = useState<ProcessResult | null>(null);

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const result = await jpegr.process(input);

    if (!result.success) {
      jpegr.clear();
      setState(result);
      return;
    }

    setState(result);
  };

  return (
    <>
      <input type='file' accept='image/*' onChange={onChange} />
      <hr />
      {state?.error ? <p role='alert'>{state.error}</p> : null}
      {state?.success && state.image ? (
        <>
          <img src={state.image.src} alt='Selected image preview' />
          <hr />
          <pre>{JSON.stringify(state.image.metadata, null, 2)}</pre>
        </>
      ) : null}
    </>
  );
};
