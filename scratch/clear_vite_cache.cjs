const fs = require('fs');
const path = require('path');

const viteCacheDir = path.resolve('node_modules/.vite');
if (fs.existsSync(viteCacheDir)) {
  console.log("Found Vite cache directory at:", viteCacheDir);
  try {
    fs.rmSync(viteCacheDir, { recursive: true, force: true });
    console.log("✓ Successfully deleted Vite cache directory.");
  } catch(e) {
    console.error("Failed to delete Vite cache:", e.message);
  }
} else {
  console.log("Vite cache directory not found.");
}
