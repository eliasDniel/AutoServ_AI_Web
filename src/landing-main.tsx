import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import LandingPage from './views/LandingPage';

createRoot(document.getElementById('landing-root')!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>
);
