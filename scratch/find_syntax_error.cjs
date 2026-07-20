const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  try {
    // Try to run a quick regex check or brackets count
    let braceCount = 0;
    let parenCount = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (content[i] === '(') parenCount++;
      if (content[i] === ')') parenCount--;
    }
    console.log("Brace balance:", braceCount);
    console.log("Paren balance:", parenCount);
    
    // Let's use simple JS parsing
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    new AsyncFunction(content);
    console.log("No basic JS syntax error");
  } catch (err) {
    console.log("Parsing error:", err.message);
  }
}
