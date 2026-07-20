const fs = require('fs');

const iconFile = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\ModernIcon.jsx';
if (fs.existsSync(iconFile)) {
  const stat = fs.statSync(iconFile);
  console.log("ModernIcon.jsx exists! Size:", stat.size, "mtime:", stat.mtime.toISOString());
} else {
  console.log("ModernIcon.jsx does NOT exist in src/components/");
}
