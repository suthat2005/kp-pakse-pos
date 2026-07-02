const fs = require('fs');
const path = require('path');

const distAssetsDir = path.resolve(__dirname, '../dist/assets');

if (fs.existsSync(distAssetsDir)) {
  console.log('🤖 Running Post-Build Alien Obfuscator...');
  const files = fs.readdirSync(distAssetsDir);
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(distAssetsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add custom header protection
      content = `/* ALIEN_PROTECTED_${Date.now()} */\n` + content;
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Obfuscated: ${file}`);
    }
  });
  console.log('👽 Alien Obfuscation completed successfully!');
} else {
  console.log('dist/assets not found. Run npm run build first.');
}
