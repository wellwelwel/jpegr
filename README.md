# 🖼️ JPEGR

A browser module to take **all image formats** supported by `HTMLCanvasElement` and convert them to **JPEG** with **size-targeted compression** to meet a configurable maximum output size.

- [**JPEGR Playground**](https://wellwelwel.github.io/jpegr/) 🎮

---

<details>
<summary>
 <b>Table of contents</b>
</summary>

- [Key features](#key-features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [API reference](#api-reference)
  - [Constructor](#constructor)
  - [Methods](#methods)
  - [Types](#types)
- [Examples](#examples)
  - [JavaScript and TypeScript](#javascript-and-typescript)
    - [Upload to a backend endpoint](#upload-to-a-backend-endpoint)
  - [React](#%EF%B8%8F-react)
- [Troubleshooting](#troubleshooting)
  - [Browser support](#browser-support)
  - [Debugging](#debugging)
- [Security notes](#security-notes)
- [License](#license)

</details>

---

## Key features

- Always outputs **JPEG**.
- Uses the original image when both format and size are within expectations.
- Normalizes **EXIF** orientation for **JPEG** inputs _(common "bug" in smartphone photos)_.
- **Automatic compression** starts from a chosen initial quality and will step down as needed until the output fits the size limit or reaches the minimum quality threshold.

---

## Installation

```sh
npm i jpegr
```

- No external dependencies are required.

---

## Quick start

### Convert an image file and display a preview

#### From Input

```ts
import { JPGER } from 'jpegr';

const input = document.querySelector<HTMLInputElement>('#file')!;
const jpegr = new JPGER({
  preview: document.querySelector<HTMLImageElement>('#preview'),
});

input.addEventListener('change', async () => {
  const result = await jpegr.process(input);

  console.log(result);
});
```

---

## API reference

### Constructor

#### `new JPGER(options?: JPGEROptions)`

Creates a new processor instance with its own internal cache and configuration defaults.

```ts
import { JPGER } from 'jpegr';

const jpegr = new JPGER({
  preview: null, // Specify an Image element to preview the processed image
  maxSize: 1 * 1024 * 1024,
  minQuality: 0.1,
  maxQuality: 1,
  compressionStep: 0.1,
});
```

- The example above uses all the default options.

---

### Methods

#### `process`

Processes an `HTMLInputElement` _(`<input type="file">`)_ or an image `File | Blob`.

```ts
const result = await jpegr.process(inputElement);
```

#### `upload`

Uploads the cached processed image to a backend URL as multipart form data.

**Options:**

- `field` (default: `"image"`)
- `name` (default: `"image.jpeg"`)
- `init` (optional `RequestInit` merged into the fetch options)

```ts
const response = await jpegr.upload('/api/upload', {
  field: 'image',
  name: 'image.jpeg',
  init: {
    headers: {
      // ...
    },
  },
});
```

#### `clear`

Clears the stored processed image from memory.

```ts
jpegr.clear();
```

---

## Examples

### JavaScript and TypeScript

```html
<input id="file" type="file" accept="image/*" />
<hr />
<img id="preview" width="100%" />
```

```ts
import { JPGER } from 'jpegr';

const input = document.querySelector('#file');
const jpegr = new JPGER({
  preview: document.querySelector('#preview'),
});

input.addEventListener('change', async () => {
  const result = await jpegr.process(input);

  if (!result.success) {
    console.error(result.error);
    jpegr.clear();
    return;
  }

  const { metadata } = result.image;
  console.info(metadata);
});
```

#### Upload to a backend endpoint

```ts
import { JPGER } from 'jpegr';

const jpegr = new JPGER();

const result = await jpegr.process(file);
if (!result.success) throw new Error(result.error);

await jpegr.upload('/api/upload', {
  field: 'image',
  name: `image.jpeg`,
});
```

### React

```tsx
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
```

#### Overview

<img src="./.github/assets/sample.png" alt="React example overview" width="360" />

- Check this example in [**./examples/vite**](./examples/vite/).

---

## Troubleshooting

### Browser support

This module requires standard browser APIs:

- `FileReader`
- `HTMLCanvasElement`
- `Blob` or `File`

If some of these features are unavailable in the browser, the original image will be used, regardless of size or type.

> [!TIP]
>
> If you need to prevent this behavior, you can use the static method `JPGER.getRuntimeSupport()` to check for **JPEGR** support before attempting image processing, for example:
>
> ```ts
> import { JPGER } from 'jpegr';
>
> if (!JPGER.canProcess()) {
>   // ...
> }
> ```

### Debugging

Check feature availability in browsers:

```ts
import { JPGER } from 'jpegr';

const support = JPGER.getRuntimeSupport();
/**
 * {
 *   FileReader: true,
 *   Blob: true,
 *   File: true,
 *   HTMLCanvasElement: true,
 *   canvasToBlob: true,
 *   createObjectURL: true,
 *   createImageBitmap: true
 * }
 */
```

---

## Security notes

- This module runs entirely on the client side and does not upload anything unless you call `upload()`.
- Treat user-provided images as untrusted input. While browser image decoders are hardened, you should still validate server-side uploads.

---

## License

**JPEGR** is under the [**MIT License**](https://github.com/wellwelwel/jpegr/blob/main/LICENSE).<br />
Copyright © 2025-present [Weslley Araújo](https://github.com/wellwelwel) and **JPEGR** [contributors](https://github.com/wellwelwel/jpegr/graphs/contributors).
