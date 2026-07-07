@echo off
title POS System - Silent Print Mode
color 0A
echo ===================================================
echo  POS System - Silent Print Mode
echo ===================================================
echo.

:: -------------------------------------------------------------------
:: CONFIGURATION: Set your live web URL here.
:: -------------------------------------------------------------------
set "TARGET_URL=https://kp-pakse-suthatpospos.shop/pos"

echo Target URL: %TARGET_URL%
echo.
echo Starting local print helper server...
start /min "" node server.js --prod
timeout /t 3 /nobreak >nul
echo.
echo IMPORTANT:
echo 1. Ensure your receipt printer (GP-L80250 Series) is set as the
echo    "DEFAULT PRINTER" in Windows Settings.
echo 2. Edge/Chrome will now print SILENTLY and INSTANTLY without
echo    showing any print dialog.
echo.
pause
echo.
 
:: Kill ALL browser instances first to ensure the new flags take effect
echo Closing all browser instances...
taskkill /f /im msedge.exe >nul 2>&1
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im chromium.exe >nul 2>&1
timeout /t 2 /nobreak >nul
 
:: Detect Edge
set "EDGE_PATH="
for %%P in (
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  "%USERPROFILE%\AppData\Local\Microsoft\Edge\Application\msedge.exe"
) do (
  if exist %%P set "EDGE_PATH=%%~P"
)
 
:: Detect Chrome
set "CHROME_PATH="
for %%P in (
  "C:\Program Files\Google\Chrome\Application\chrome.exe"
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
  "%USERPROFILE%\AppData\Local\Google\Chrome\Application\chrome.exe"
) do (
  if exist %%P set "CHROME_PATH=%%~P"
)
 
:: Launch with --kiosk-printing (Bypasses print preview and print dialog completely)
if not "%EDGE_PATH%"=="" (
  echo Starting Microsoft Edge in silent print mode...
  start "" "%EDGE_PATH%" --kiosk-printing "%TARGET_URL%"
  echo Done! Edge started.
  goto :end
)
 
if not "%CHROME_PATH%"=="" (
  echo Starting Google Chrome in silent print mode...
  start "" "%CHROME_PATH%" --kiosk-printing "%TARGET_URL%"
  echo Done! Chrome started.
  goto :end
)
 
echo [ERROR] No supported browser found!
pause
 
:end
timeout /t 2 /nobreak >nul
exit