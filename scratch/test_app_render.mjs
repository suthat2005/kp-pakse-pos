import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = 'file://' + path.resolve(__dirname, '../dist/assets/index-Cl2K5ASw.js').replace(/\\/g, '/');
const dbPath = path.resolve(__dirname, '../db_shared.json');

// Read actual DB
let localDb = {};
if (fs.existsSync(dbPath)) {
  localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Mock localStorage with actual DB values mapped to 'amulet_pos_' keys
const storageMock = {};
Object.keys(localDb).forEach(key => {
  const data = localDb[key]?.data;
  if (data !== undefined) {
    storageMock['amulet_pos_' + key] = JSON.stringify(data);
  }
});

// Also mock active user to be owner@gmail.com
const users = localDb.users?.data || [];
const ownerUser = users.find(u => u.role === 'owner') || users[0];
if (ownerUser) {
  storageMock['amulet_pos_active_user'] = JSON.stringify(ownerUser);
}

// Mock browser globals
global.window = {
  location: { href: 'http://localhost/', pathname: '/', search: '' },
  navigator: { userAgent: 'node' },
  addEventListener: () => {},
  removeEventListener: () => {},
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
  localStorage: {
    getItem: (key) => storageMock[key] || null,
    setItem: (key, val) => { storageMock[key] = val; },
    removeItem: (key) => { delete storageMock[key]; }
  },
  webkitAudioContext: function() {},
  AudioContext: function() {}
};
global.MutationObserver = class { observe() {} disconnect() {} };
global.HTMLIFrameElement = class {};
global.window.HTMLIFrameElement = global.HTMLIFrameElement;

const rootElement = {
  nodeType: 1,
  ownerDocument: null,
  appendChild: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.document = {
  documentElement: {
    style: {
      removeProperty: () => {},
      setProperty: () => {}
    }
  },
  getElementById: () => rootElement,
  getElementsByTagName: () => [],
  createTextNode: () => rootElement,
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({
    setAttribute: () => {},
    style: {},
    appendChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  }),
  head: {
    appendChild: () => {}
  },
  body: {
    appendChild: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    }
  },
  querySelector: () => null,
  querySelectorAll: () => []
};

rootElement.ownerDocument = global.document;

Object.defineProperty(global, 'navigator', { value: global.window.navigator, configurable: true });
Object.defineProperty(global, 'localStorage', { value: global.window.localStorage, configurable: true });
Object.defineProperty(global, 'location', { value: global.window.location, configurable: true });

console.log('Evaluating bundle with actual DB data...');
try {
  // Capture unhandled rejections/exceptions
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION DURING RUNTIME:', err);
  });
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION DURING RUNTIME:', err);
  });

  await import(bundlePath);
  console.log('Bundle evaluation completed.');
  
  // Wait a bit for React rendering tick
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('App render verification completed successfully!');
} catch (e) {
  console.error('CRITICAL APP RENDER ERROR:', e);
}
