@echo off
echo ===================================================
echo 🚨 STARTING EMERGENCY LIVE ROLLBACK WORKFLOW
echo ===================================================

if not exist .git\LAST_WORKING_COMMIT (
    echo.
    echo ❌ ERROR: Last working commit checkpoint not found!
    echo.
    pause
    exit /b 1
)

set /p ROLLBACK_COMMIT=<.git\LAST_WORKING_COMMIT
rem Trim whitespace
for /f "tokens=1" %%a in ("%ROLLBACK_COMMIT%") do set ROLLBACK_COMMIT=%%a

if "%ROLLBACK_COMMIT%"=="" (
    echo.
    echo ❌ ERROR: Checkpoint file is empty!
    echo.
    pause
    exit /b 1
)

echo.
echo ⚠️ WARNING: This will rollback the live website to commit: %ROLLBACK_COMMIT%
echo.
set /p confirm="Are you sure you want to rollback the live website? (y/n): "
if /i not "%confirm%"=="y" (
    echo.
    echo ❌ Rollback cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo ⏪ [Step 1/2] Resetting local repository to checkpoint...
git reset --hard %ROLLBACK_COMMIT%

echo.
echo ☁️ [Step 2/2] Force-pushing to GitHub (Triggers Rollback)...
git push origin main --force

echo.
echo ===================================================
echo ✓ Rollback completed successfully!
echo ✓ Check Render/Railway dashboard for rollback status.
echo ===================================================
pause
