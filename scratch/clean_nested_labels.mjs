import fs from 'fs';
import path from 'path';

const srcDir = './src';

// Parse arguments of a function call by matching balanced quotes and parentheses
function parseArgs(str) {
  const args = [];
  let current = '';
  let parenDepth = 0;
  let inQuote = null;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inQuote) {
      if (char === inQuote && str[i - 1] !== '\\') {
        inQuote = null;
      }
      current += char;
    } else {
      if (char === "'" || char === '"' || char === '`') {
        inQuote = char;
        current += char;
      } else if (char === '(') {
        parenDepth++;
        current += char;
      } else if (char === ')') {
        parenDepth--;
        current += char;
      } else if (char === ',' && parenDepth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }
  return args;
}

function flattenGetLabel(expr) {
  // Check if expr is a db.getLabel call
  if (!expr.startsWith('db.getLabel(') || !expr.endsWith(')')) {
    return expr;
  }
  
  const innerContent = expr.substring(12, expr.length - 1);
  const args = parseArgs(innerContent);
  if (args.length < 2) {
    return expr;
  }
  
  const firstArg = args[0];
  const secondArg = args[1];
  
  if (firstArg.startsWith('db.getLabel(')) {
    // Recursively flatten the first argument!
    const flattenedFirst = flattenGetLabel(firstArg);
    // Now get the innermost key and default value
    if (flattenedFirst.startsWith('db.getLabel(')) {
      const innerContent2 = flattenedFirst.substring(12, flattenedFirst.length - 1);
      const args2 = parseArgs(innerContent2);
      if (args2.length >= 2) {
        // Return db.getLabel(innermost_key, outermost_default)
        return `db.getLabel(${args2[0]}, ${secondArg})`;
      }
    }
  }
  
  return expr;
}

function cleanContent(content) {
  let index = 0;
  let newContent = '';
  
  while (index < content.length) {
    const nextCall = content.indexOf('db.getLabel(', index);
    if (nextCall === -1) {
      newContent += content.substring(index);
      break;
    }
    
    newContent += content.substring(index, nextCall);
    
    // Find the end of the balanced parentheses for this db.getLabel call
    let parenDepth = 0;
    let inQuote = null;
    let endCall = -1;
    
    for (let i = nextCall + 11; i < content.length; i++) {
      const char = content[i];
      if (inQuote) {
        if (char === inQuote && content[i - 1] !== '\\') {
          inQuote = null;
        }
      } else {
        if (char === "'" || char === '"' || char === '`') {
          inQuote = char;
        } else if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          parenDepth--;
          if (parenDepth === 0) {
            endCall = i;
            break;
          }
        }
      }
    }
    
    if (endCall !== -1) {
      const fullCall = content.substring(nextCall, endCall + 1);
      const flattened = flattenGetLabel(fullCall);
      newContent += flattened;
      index = endCall + 1;
    } else {
      newContent += 'db.getLabel(';
      index = nextCall + 12;
    }
  }
  
  return newContent;
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const cleaned = cleanContent(content);
      if (cleaned !== content) {
        fs.writeFileSync(fullPath, cleaned, 'utf8');
        console.log(`Cleaned nested labels in ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
console.log('Cleanup completed!');
