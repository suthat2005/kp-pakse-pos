@echo off
echo 🚨 Reverting local changes to match remote main branch...
git checkout main
git fetch origin
git reset --hard origin/main
echo ✓ Revert complete! Local state matches origin/main.
pause
