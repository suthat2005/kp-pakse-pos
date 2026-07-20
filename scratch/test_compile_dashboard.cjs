try {
  // Let's read the file and eval it as a script to see if there is any syntax error!
  // To avoid executing React code, we can just compile it or read it and check if it parses.
  const fs = require('fs');
  const code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
  
  // We can use the vm module to compile it without running it!
  const vm = require('vm');
  console.log("Compiling Dashboard.jsx using Node VM...");
  new vm.Script(code);
  console.log("✓ No syntax errors found by Node V8 compiler!");
} catch(e) {
  console.error("❌ Node V8 compilation failed:");
  console.error(e.stack);
}
