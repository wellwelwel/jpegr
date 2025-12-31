# 🖼️ JPEGR

A browser module to take **all image format** supported by `HTMLCanvasElement` and convert them to **JPEG** with **size-targeted compression** to meet a configurable maximum output size.

- [**JPEGR Playground**](wellwelwel.github.io/jpegr/) 🎮

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
  - [Getters](#getters)
  - [Types](#types)
- [Examples](#examples)
  - [JavaScript and TypeScript](#javascript-and-typescript)
    - [Upload to a backend endpoint](#upload-to-a-backend-endpoint)
  - [React](#%EF%B8%8F-react)
- [Browser support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Considerations](#considerations)
- [Security notes](#security-notes)
- [License](#license)

</details>

---

## Key features

- **Always outputs JPEG**.
- Uses the original image when both format and size are within expectations.
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
  await jpegr.fromInput(input);
});
```

#### From File

```ts
import { JPGER } from 'jpegr';

const input = document.querySelector<HTMLInputElement>('#file')!;
const jpegr = new JPGER({
  preview: document.querySelector<HTMLImageElement>('#preview'),
});

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) {
    console.error('No file selected.');
    jpegr.clear();

    return;
  }

  await jpegr.fromFile(file);
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

#### `fromInput`

Processes the first file in an `<input type="file">`.

```ts
const result = await jpegr.fromInput(inputElement, 1024 * 1024);
```

- Returns `{ success: false, error: "No file selected." }` if the input has no file.

#### `fromFile`

Processes an image `File` and stores the result in memory on success.

```ts
const result = await jpegr.fromFile(file, 1024 * 1024);
```

- Returns `{ success: false, error: "No file selected." }` if the input has no file.

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

### Getters

#### `image`

- Returns the latest processed image or `null`.

#### `fileSize`

- Returns the processed blob size in bytes. Returns `0` if there is no processed image.

#### `fileSizeFormatted`

- Human-readable file size.

#### `wasConverted`

- Returns `true` if the input file MIME type was not `image/jpeg`.

#### `wasCompressed`

- Returns `true` if the module had to lower the JPEG quality to meet the size limit.

#### `compressionQuality`

- Returns the final quality used for encoding (range `minQuality..1.0`).
- If no image has been processed, it returns the instance default quality (from the constructor).

#### `metadata`

- Returns full metadata or `null` if no image has been processed.

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
  const result = await jpegr.fromInput(input);

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

const result = await jpegr.fromFile(file, 1 * 1024 * 1024);
if (!result.success) throw new Error(result.error);

await jpegr.upload('/api/upload', {
  field: 'image',
  name: `image.jpeg`,
});
```

### React

```tsx
import type { ChangeEvent } from 'react';
import { JPGER } from 'jpegr';
import { useRef, useState } from 'react';

type State =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ready'; previewUrl: string; sizeLabel: string };

export const ImagePreview = () => {
  const [state, setState] = useState<State>({ status: 'idle' });
  const jpegrRef = useRef(new JPGER({ maxQuality: 0.9 }));
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (_event: ChangeEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    const result = await jpegrRef.current.fromInput(input);
    if (!result.success) {
      jpegrRef.current.clear();
      setState({ status: 'error', message: result.error });
      return;
    }

    setState({
      status: 'ready',
      previewUrl: result.image.dataUrl,
      sizeLabel: jpegrRef.current.fileSizeFormatted,
    });
  };

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <input ref={inputRef} type='file' accept='image/*' onChange={onChange} />

      {state.status === 'error' ? <p role='alert'>{state.message}</p> : null}

      {state.status === 'ready' ? (
        <img
          src={state.previewUrl}
          alt='Selected image preview'
          style={{ width: '100%', borderRadius: 8 }}
        />
      ) : null}

      {state.status === 'ready' ? <p>{state.sizeLabel}</p> : null}
    </div>
  );
};
```

---

## Browser support

This module requires standard browser APIs:

- `FileReader`
- `HTMLCanvasElement`
- `Blob` or `ArrayBuffer`, `Uint8Array`, and `atob`

---

## Troubleshooting

### “Canvas not supported”

The browser does not provide a 2D canvas context (`canvas.getContext('2d')` returned `null`). This can happen in very old browsers or restricted environments.

---

## Considerations

- **EXIF orientation is not corrected.** Some JPEG photos may appear rotated if you rely on EXIF orientation metadata. If you need orientation correction, look for solutions around “EXIF orientation canvas drawImage” and consider reading EXIF with a dedicated library.

---

## Security notes

- This module runs entirely on the client side and does not upload anything unless you call `upload()`.
- Treat user-provided images as untrusted input. While browser image decoders are hardened, you should still validate server-side uploads.

---

## License

**JPEGR** is under the [**MIT License**](https://github.com/wellwelwel/jpegr/blob/main/LICENSE).<br />
Copyright © 2025-present [Weslley Araújo](https://github.com/wellwelwel) and **JPEGR** [contributors](https://github.com/wellwelwel/jpegr/graphs/contributors).
