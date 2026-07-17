# KCS EduPlanner Installable Distribution

This folder contains the installable distribution materials for KCS EduPlanner.

## Recommended install method for every OS

Use the hosted PWA:

https://propheticpowerfulman.github.io/LessonPlanPowerfullyDone/

The app already includes the KCS school logo in its web app manifest, so the installed app icon on desktop, phone, or tablet will use the school logo when installed from a supported browser.

## Desktop installation

Windows, macOS, Linux, and ChromeOS:

1. On Windows, double-click `Install-KCS-EduPlanner-Windows.cmd` to open the app directly in an installable app window when Edge or Chrome is available.
2. Or open the hosted link in Chrome, Edge, or another PWA-capable browser.
3. Use the browser install button in the address bar, or open the browser menu and choose `Install app`.
4. The app will appear like a normal desktop application with the KCS logo.

## Android installation

1. Open the hosted link in Chrome.
2. Tap the browser menu.
3. Tap `Install app` or `Add to Home screen`.
4. The app will appear on the home screen with the KCS logo.

## iPhone and iPad installation

1. Open the hosted link in Safari.
2. Tap the share button.
3. Tap `Add to Home Screen`.
4. Confirm the name `KCS Planner`.

## Offline web build

The `KCS-EduPlanner-WebBuild` folder contains the latest production web build. It is useful for archiving or hosting on a web server. For full installation behavior, service workers, routing, and the app icon work best from the hosted HTTPS link above.

## Icons

The `Icons` folder contains the KCS logo assets used by the installable app.

## Native executables

A single universal executable for all desktop and mobile operating systems does not exist. Native installers require separate packaging steps for each platform, for example:

- Windows: `.exe` or `.msi`
- macOS: `.dmg` or `.app`
- Linux: `.AppImage`, `.deb`, or `.rpm`
- Android: `.apk` or Play Store package
- iPhone/iPad: App Store build through Apple Developer tools

The PWA method above is the cross-platform installable version that works across desktop, mobile, and tablets from the same project.
