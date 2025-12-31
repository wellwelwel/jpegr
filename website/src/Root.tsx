import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ImagePreview } from './ImagePreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ImagePreview />
  </StrictMode>
);
