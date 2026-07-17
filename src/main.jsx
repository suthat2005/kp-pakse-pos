// Chunk load error handler to auto-reload page when new deployment changes chunk hashes
window.addEventListener('error', (e) => {
  const isChunkError = e.message && (
    e.message.includes('dynamically imported module') || 
    e.message.includes('Failed to fetch') ||
    e.message.includes('chunk')
  );
  if (isChunkError) {
    console.warn("Vite chunk load error detected. Reloading page...");
    window.location.reload();
  }
}, true);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global API Fetch Interceptor
const originalFetch = window.fetch;
window.fetch = function (resource, options = {}) {
  const urlString = typeof resource === 'string' ? resource : resource.url;
  
  if (urlString && (urlString.startsWith('/api/') || urlString.includes('/api/')) && !urlString.includes('/api/server-ip')) {
    options.headers = {
      ...options.headers,
      'Authorization': 'Bearer KP-Pakse-Secret-Token-2026'
    };
  }
  return originalFetch.call(this, resource, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
