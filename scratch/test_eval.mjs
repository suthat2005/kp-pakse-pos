import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = 'file://' + path.resolve(__dirname, '../dist/assets/index-C3-mnKmt.js').replace(/\\/g, '/');

// Mock browser globals
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
  AudioContext: function() {}
};
global.MutationObserver = class { observe() {} disconnect() {} };
global.document = {
  getElementById: () => ({
    appendChild: () => {}
  }),
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
Object.defineProperty(global, 'navigator', { value: global.window.navigator, configurable: true });
Object.defineProperty(global, 'localStorage', { value: global.window.localStorage, configurable: true });
Object.defineProperty(global, 'location', { value: global.window.location, configurable: true });

console.log('Evaluating bundle...');
try {
  // Import dynamically
  await import(bundlePath);
  console.log('Bundle evaluated successfully with no runtime syntax/evaluation errors!');
} catch (e) {
  console.error('CRASH DETECTED DURING EVALUATION:');
  console.error(e);
}
