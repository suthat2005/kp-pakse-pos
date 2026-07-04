@echo off
echo ===================================================
echo 🚀 STARTING SAFE LIVE DEPLOYMENT WORKFLOW
echo ===================================================

echo.
echo 📦 [Step 1/4] Running Database Backup...
powershell -ExecutionPolicy Bypass -File backup-db.ps1

echo.
echo 💾 [Step 2/4] Saving current commit as last working checkpoint...
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set CURRENT_COMMIT=%%i
echo %CURRENT_COMMIT% > .git\LAST_WORKING_COMMIT
echo Checkpoint saved: %CURRENT_COMMIT%

echo.
echo 📝 [Step 3/4] Preparing Git Commit...
set /p commit_msg="Enter commit message (Enter for 'Safe Live Deploy'): "
if "%commit_msg%"=="" set commit_msg="Safe Live Deploy"

git add .
git commit -m "%commit_msg%"

echo.
echo ☁️ [Step 4/4] Pushing to GitHub (Auto-Deploy)...
git push origin main

echo.
echo ===================================================
echo ✓ Deployment complete!
echo ✓ Check Render/Railway dashboard for status.
echo ✓ If errors occur, run 'rollback-live.bat' immediately.
echo ===================================================
pause
