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
