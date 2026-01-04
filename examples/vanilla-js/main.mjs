import { JPGER } from 'https://cdn.jsdelivr.net/npm/jpegr@latest/lib/index.mjs';

const input = document.querySelector('#file');
const preview = document.querySelector('#preview');
const pre = document.querySelector('#result');

const jpegr = new JPGER({ preview });

input.addEventListener('change', async () => {
  const result = await jpegr.process(input);

  if (!result.success) {
    console.error(result.error);
    jpegr.clear();
  }

  pre.textContent = JSON.stringify(result, null, 2);
});
