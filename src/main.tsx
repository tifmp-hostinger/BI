import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { instalaRecuperacaoDeDeploy } from '@/lib/chunkDesatualizado';
import './fmp-tokens.css';
import './index.css';

instalaRecuperacaoDeDeploy();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
