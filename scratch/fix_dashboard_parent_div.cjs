const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldPiece = `            />
          </div>
        )}
        </div>

      {/* ═══════════════════
          KPI SKELETON / LOADING`;

  const newPiece = `            />
          </div>
        )}
        </div>
      </div>

      {/* ═══════════════════
          KPI SKELETON / LOADING`;

  if (content.includes(oldPiece)) {
    content = content.replace(oldPiece, newPiece);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Fixed parent header div tag closure!");
  } else {
    console.log("oldPiece not found");
  }
}
