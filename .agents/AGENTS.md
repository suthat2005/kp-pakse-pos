# Rules for Antigravity AI Coding Assistant

## ⚠️ Safe Updates & Live Production Rules
- **Immediate Rollbacks on Failure:** During code updates, if any modification results in compilation errors (`npm run dev` or `npm run build` fails) or runtime crashes, immediately restore the files to the last working commit using git.
- **Database Safety (Zero Data Loss):** Never overwrite, clear, or modify `db_shared.json` or local storage with empty or default values. Never modify product listings, stock levels, client databases, or active queue slots unless explicitly requested.
- **No Unrelated Code Deletions:** Always preserve unrelated logic, elements, and styles. Do not delete or add code blocks arbitrarily.
