# sbe - Scrapbox in Electron
A unofficial [Scrapbox](https://scrapbox.io) Desktop App by Electron.

## Features
- It can be Launch as an application independent from the browser.
- You can search within the page.
- You can cut, copy and paste using the shortcut key defined for each OS.
- You can go back to the previous screen or proceed to the next screen.

## How to run
### Versions
- Node.js v10
- npm 3.7.3 or later
- electron v1.8.6 or later

### run
1. git clone or download zip.
1. npm install
1. npm start

## How to build package
### Versions
- electron-packager 12.0.2

### build (for macOS)
1. npm run package-macos
1. binary will be generated in ./mtwe-darwin-x64

### build (for Windows)
1. npm run package-win32
1. binary will be generated in ./mtwe-win32-x64