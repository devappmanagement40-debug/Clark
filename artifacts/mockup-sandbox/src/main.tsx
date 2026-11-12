import { createRoot } from 'react-dom/client';

import App from './App';

const isIsolatedDuluxPreview = /\/preview\/dulux-(signup|login|wheel)\//.test(
  window.location.pathname,
);

if (!isIsolatedDuluxPreview) {
  void import('./index.css');
}

createRoot(document.getElementById('root')!).render(<App />);
