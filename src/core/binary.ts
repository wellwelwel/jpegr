import { supports } from './utils.js';

export const arrayBufferToBinary = (buffer: ArrayBuffer): string => {
  if (supports.Uint8Array) {
    const bytes = new Uint8Array(buffer);
    const chars: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
      chars.push(String.fromCharCode(bytes[i]));
    }
    return chars.join('');
  }

  if (supports.DataView) {
    const view = new DataView(buffer);
    const chars: string[] = [];
    for (let i = 0; i < buffer.byteLength; i++) {
      chars.push(String.fromCharCode(view.getUint8(i)));
    }
    return chars.join('');
  }

  throw new Error('No supported methods to convert ArrayBuffer to binary.');
};

export const binaryToArrayBuffer = (binary: string): ArrayBuffer => {
  const length = binary.length;

  if (supports.Uint8Array) {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  if (supports.DataView) {
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    for (let i = 0; i < length; i++) {
      view.setUint8(i, binary.charCodeAt(i));
    }
    return buffer;
  }

  throw new Error('No supported methods to convert binary to ArrayBuffer.');
};
