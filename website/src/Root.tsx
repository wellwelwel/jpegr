import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ImagePreview } from './ImagePreview.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ImagePreview />
  </StrictMode>
);
