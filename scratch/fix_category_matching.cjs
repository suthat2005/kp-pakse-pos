const fs = require('fs');

const posFile = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src/components/POS.jsx';
const dbFile = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/db_shared.json';

// 1. Fix POS.jsx category matching
if (fs.existsSync(posFile)) {
  let content = fs.readFileSync(posFile, 'utf8');
  const oldCode = "const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;";
  const newCode = "const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || (selectedCategory === 'amulet_frames' && p.category === 'frames') || (selectedCategory === 'frames' && p.category === 'amulet_frames');";

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(posFile, content, 'utf8');
    console.log("✓ POS.jsx category matching updated successfully!");
  } else {
    console.log("POS.jsx already has updated category matching or pattern not found.");
  }
}

// 2. Fix db_shared.json categories list
if (fs.existsSync(dbFile)) {
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  if (db.categories) {
    const cats = db.categories.data || db.categories;
    if (Array.isArray(cats)) {
      // Check if 'frames' ID is present
      const hasFrames = cats.some(c => c.id === 'frames');
      if (!hasFrames) {
        cats.unshift({
          id: 'frames',
          name: 'ກອບພຣະ',
          icon: '🖼️',
          type: 'physical'
        });
        fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
        console.log("✓ Added 'frames' category to db_shared.json!");
      }
    }
  }
}
