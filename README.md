# sbe - Scrapbox in Electron
An unofficial [Scrapbox](https://scrapbox.io) Desktop App by Electron.

## Features
- Open Scrapbox pages in tabs
- Open external url with default web browser
- Search within the page
- Cut, copy and paste widh accelerator keys
- Text box that can open Scrapbox page from url, and also search with key-words
- Paste external link with `[url title]` format
- Show pages-list that can be sorted by updated / views / linked with pagination
- Add pages to fav list
- Preview page info (author, colaborators, descriptions)
- Preview 1-hop links of current page
- Show project activities (total pages created, total views and linked)
- Show user's activities (page created)

![Screenshot](https://user-images.githubusercontent.com/2092183/50725987-ceb89980-1149-11e9-9017-fb7186ce00b1.gif)

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

if you are in proxy environment,

```
$ npm run proxy --sbe:proxy=your.proxy.host:port
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

if you run binary in proxy. you have to add argument (via shortcut link) as below

```
sbe.exe --proxy-server=your.proxy.host:port
```