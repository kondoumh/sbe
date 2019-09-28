# sbe - Scrapbox in Electron
An unofficial [Scrapbox](https://scrapbox.io) Desktop App by Electron.

## Features
### Tabs
- View and edit Scrapbox pages in tabs (not possible with PWA)
### Editing
- Paste external link with `[url title]` format
- Cut, copy and paste with accelerator keys
- Context menu for changing font size of selected text
### Meta view
- Provide Page-list that can be sorted by updated / views / linked with pagination
- Preview page info (author, collaborators, descriptions)
- Preview 1-hop links of current page
- Show project activities (total pages created, total views and linked)
- Show user's activities (pages created)
### Utilities
- In-page search
- Text box to open page by url and search with in project
- Open external url with web browser
- Search selected text on Google with web browser
- Add pages to fav list

![Screenshot](https://user-images.githubusercontent.com/2092183/63644879-904e0a00-c72d-11e9-96d2-64e4727e64c6.gif)


## How to install
Download installer for each platform from Releases and execute.

- macOS: sbe-version-mac.zip
- Windows: sbe.Setup.version.exe

## How to run with Electron
### requirement
Node.js v10 or later

### run
git clone or download zip.

```
$ cd sbe
$ npm install
$ npm start
```

### How to run test

You need to build runtime module before running test.

```
$ npm run pack
$ npm test
```

Under proxy server, `no_proxy` setting may be required.

```
$ export {no_proxy,NO_PROXY}="127.0.0.1,localhost"
```

## How to build package

Currently Windows and macOS only.

```
$ npm run dist
```

Setup modules(exe / dmg), and zip will be generated in ./dist