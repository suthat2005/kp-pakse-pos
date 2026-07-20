const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Find where it ends
  const badSuffix = `          {/* ═══════════════════════
              QUICK ACTIONS
          ═══════════════════════ */}
          </div>
    );
}`;

  const goodSuffix = `        </>
      )}
    </div>
  );
}`;

  if (content.includes(badSuffix)) {
    content = content.replace(badSuffix, goodSuffix);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Fixed closing brackets and fragments in Dashboard.jsx!");
  } else {
    console.log("badSuffix not found in Dashboard.jsx");
  }
}
