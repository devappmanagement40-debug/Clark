import { createRoot } from 'react-dom/client';

import App from './App';

const isIsolatedDuluxAuthPreview = /\/preview\/dulux-(signup|login)\//.test(
  window.location.pathname,
);

if (!isIsolatedDuluxAuthPreview) {
  void import('./index.css');
}

createRoot(document.getElementById('root')!).render(<App />);
