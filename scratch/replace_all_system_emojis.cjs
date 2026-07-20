const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\utils\\db.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Replace each list constant
  const listsToEmpty = [
    'DEFAULT_CATEGORIES',
    'DEFAULT_PRODUCTS',
    'DEFAULT_PROMOTIONS',
    'DEFAULT_CCTV_CAMERAS',
    'DEFAULT_CCTV_ALERTS',
    'DEFAULT_ATTENDANCE_LOGS',
    'DEFAULT_ORDERS',
    'DEFAULT_DEBTS',
    'DEFAULT_FRAMING_JOBS',
    'DEFAULT_AUDIT_LOGS'
  ];

  listsToEmpty.forEach(name => {
    // Regex matches: const NAME = [ ... ];
    // We use a regex that matches up to the closing ]; at the end of the array.
    // Since arrays can contain nested objects/arrays, matching the end requires finding the balanced bracket
    // or matching the exact string content.
    // Let's print out if it was successfully matched and replaced.
    const regex = new RegExp(`const ${name} = \\[[\\s\\S]*?\\n\\];`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `const ${name} = [];`);
      console.log(`✓ Replaced const ${name} with []`);
    } else {
      console.log(`✗ Could not match const ${name}`);
    }
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Finished cleaning mock data lists in db.js!");
} else {
  console.log("Error: db.js not found!");
}
