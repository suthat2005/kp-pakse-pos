import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Building HRM test bundle...');
  
  const outDir = path.resolve(__dirname, 'temp_build');
  
  await build({
    configFile: false,
    plugins: [react()],
    build: {
      outDir,
      lib: {
        entry: path.resolve(__dirname, 'test_hrm_render.jsx'),
        formats: ['es'],
        fileName: 'test_hrm_bundle'
      },
      rollupOptions: {
        external: [] // Bundle everything including React to make it self-contained
      }
    }
  });
  
  console.log('Vite build completed.');
  
  // Mock browser globals
  const rootElement = {
    nodeType: 1,
    ownerDocument: null,
    appendChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  
  global.window = {
    location: { href: 'http://localhost/' },
    navigator: { userAgent: 'node' },
    addEventListener: () => {},
    removeEventListener: () => {},
    fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    webkitAudioContext: function() {},
    AudioContext: function() {},
    HTMLIFrameElement: class {}
  };
  global.window.HTMLIFrameElement = global.window.HTMLIFrameElement;
  global.MutationObserver = class { observe() {} disconnect() {} };
  
  global.document = {
    getElementById: () => rootElement,
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({
      setAttribute: () => {},
      style: {}
    }),
    head: {
      appendChild: () => {}
    },
    body: {
      appendChild: () => {}
    },
    querySelector: () => null,
    querySelectorAll: () => []
  };
  
  rootElement.ownerDocument = global.document;
  
  Object.defineProperty(global, 'navigator', { value: global.window.navigator, configurable: true });
  Object.defineProperty(global, 'localStorage', { value: global.window.localStorage, configurable: true });
  Object.defineProperty(global, 'location', { value: global.window.location, configurable: true });
  
  console.log('Evaluating HRM test bundle...');
  try {
    const bundleFilePath = 'file://' + path.resolve(outDir, 'test_hrm_bundle.js').replace(/\\/g, '/');
    await import(bundleFilePath);
    
    // Give react time to render
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('HRM component rendered successfully with no runtime crashes! ✅');
  } catch (e) {
    console.error('HRM RENDER CRASH DETECTED: ❌');
    console.error(e);
  } finally {
    // Cleanup temp build files
    try {
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch(err) {}
  }
}

run();
