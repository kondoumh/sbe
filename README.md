# sbe - Scrapbox in Electron
An unofficial [Scrapbox](https://scrapbox.io) Desktop App by Electron.

## Features
- Open page in new tab (Windows: Ctrl + click / macOS: Cmd + click)
- Open top page in new tab
- Duplicate current page in new tab
- Open url with default web browser
- Search within the page
- Copy page url to the clipboard
- Cut, copy and paste widh accelerator keys
- History back / forward

## How to run
### requirement
Node.js v10

### run
git clone or download zip.

```
$ cd sbe
$ npm install
$ npm start
```

## How to build binary

### for macOS
```
$ npm run package-macos
```

binary will be generated in ./mtwe-darwin-x64

### for Windows
```
$ npm run package-win32
```

binary will be generated in ./mtwe-win32-x64