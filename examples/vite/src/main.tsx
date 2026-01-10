import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ImageMescler } from './ImageMescler.tsx';
import { ImageProcessor } from './ImageProcessor.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ImageProcessor />
    <hr />
    <ImageMescler />
  </StrictMode>
);
