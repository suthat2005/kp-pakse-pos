console.log("Dynamically importing Dashboard.jsx...");

import('../src/components/Dashboard.jsx').then(() => {
  console.log("✓ Successfully imported Dashboard.jsx!");
}).catch(err => {
  console.error("❌ Import failed:");
  console.error(err);
});
