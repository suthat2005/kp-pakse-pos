const fs = require('fs');

const file = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src/components/Customers.jsx';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Emoji regex range
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|➕|➖|📊|👤|🔍|💰|🗑️|✏️|📱|👥|📅|💼|🕐|⏰|✅|❌/gu;

  console.log("=== Emojis in Customers.jsx ===");
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("File not found:", file);
}
