@echo off
echo 🚀 Preparing deployment to GitHub (triggers live Auto-Deploy)...
git add .
set /p commit_msg="Enter commit message: "
if "%commit_msg%"=="" set commit_msg="Production deployment update"
git commit -m "%commit_msg%"
git push origin main
echo ✓ Push completed! Check Render/Railway dashboard for deployment status.
pause
