# sbe - Scrapbox in Electron
An unofficial [Scrapbox](https://scrapbox.io) Desktop App by Electron.

## Features
- Open page in new tab (Windows: Ctrl + click / macOS: Cmd + click)
- Open top page in new tab.
- Duplicate current page in new tab.
- Open url with default web browser.
- Search within the page.
- Copy page url to clipboard.
- Cut, copy and paste using the shortcut key defined for each OS.
- Go back to the previous page or proceed to the next page.

## How to run
### Versions
- Node.js v10
- npm 3.7.3 or later
- electron v3.0.8 or later
- electron-packager 12.0.2 or later

### run
1. git clone or download zip.
1. npm install
1. npm start

## How to build package
### Versions

### build (for macOS)
1. npm run package-macos
1. binary will be generated in ./mtwe-darwin-x64

### build (for Windows)
1. npm run package-win32
1. binary will be generated in ./mtwe-win32-x64