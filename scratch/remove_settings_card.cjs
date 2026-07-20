const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\server.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const target = `  // API: Debug Firebase Env
  if (pathname === '/api/debug-env' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    try {
      const sa = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
      res.end(JSON.stringify({
        project_id: sa ? sa.project_id : 'none',
        has_env: !!process.env.FIREBASE_SERVICE_ACCOUNT
      }));
    } catch(e) {
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

`;

  if (content.includes(target)) {
    content = content.replace(target, '');
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Successfully removed /api/debug-env debug route from server.js!");
  } else {
    console.log("❌ Target debug route not found in server.js!");
  }
}
