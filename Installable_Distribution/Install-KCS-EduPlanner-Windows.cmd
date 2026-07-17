@echo off
setlocal

set "APP_URL=https://propheticpowerfulman.github.io/LessonPlanPowerfullyDone/"

where msedge.exe >nul 2>nul
if %errorlevel%==0 (
  start "" msedge.exe --app="%APP_URL%"
  exit /b 0
)

where chrome.exe >nul 2>nul
if %errorlevel%==0 (
  start "" chrome.exe --app="%APP_URL%"
  exit /b 0
)

start "" "%APP_URL%"
