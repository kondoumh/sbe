# sbe - Scrapbox in Electron
An unofficial [Scrapbox](https://scrapbox.io) Desktop App by Electron.

## Features
### Tabs
- Open Scrapbox pages in tabs
### Editing
- Paste external link with `[url title]` format
- Cut, copy and paste with accelerator keys
- Context menu for changing font size of selected text
### Meta view
- Page-list can be sorted by updated / views / linked with pagination
- Preview page info (author, collaborators, descriptions)
- Preview 1-hop links of current page
- Show project activities (total pages created, total views and linked)
- Show user's activities (pages created)
### Utilities
- In-page search
- Text box to open page by url / search project by keywords
- Open external url with web browser
- Search selected text on Google
- Add pages to fav list

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