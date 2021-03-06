# sbe - Scrapbox in Electron

![OS Matrix](https://github.com/kondoumh/sbe/workflows/OS%20Matrix/badge.svg)
![Release](https://github.com/kondoumh/sbe/workflows/Release/badge.svg)

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
- Open scrapbox page from web browser via url-scheme
- Open page from browsing history
- Copy article to clipboard as Markdown format

![Screenshot](https://user-images.githubusercontent.com/2092183/63644879-904e0a00-c72d-11e9-96d2-64e4727e64c6.gif)


## How to install
Download installer for each platform from [Releases](https://github.com/kondoumh/sbe/releases) and execute.

- macOS: sbe-`version`.dmg
- Windows: sbe.Setup.`version`.exe
- Linux: sbe-`version`.AppImage

## How to run with Electron
### requirement
Node.js v10 or later

### run
git clone or download zip.

```
cd sbe
npm install
npm start
```

### How to run test

You need to build runtime module before running test.

```
npm install
npm run pack
npm test
```

Under proxy environment, `no_proxy` setting may be required.

```
export {no_proxy,NO_PROXY}="127.0.0.1,localhost"
```

## How to build exectable binary

```
npm install
npm run pack
```

Binary will be created.

- macOS: `./dist/mac/sbe.app`
- Windows: `./dis/win-unpacked/sbe.exe`


## How to build installer

Currently Windows and macOS only.

```
npm install
npm run dist
```

Setup modules wil be created.
- macOS: `./dist/mac/sbe-<version>.dmg`
- Windows: `./dist/win-unpacked/sbe.Setup.<version>.exe`

## Open from web browser

Since sbe is registered as a client of URL Scheme, it is possible to open the corresponding page with sbe by adding prefix `sbe://` to the url. 

e.g. `https://scrapbox.io/foo/bar` ==> `sbe://https://scrapbox.io/foo/bar`

This conversion can be done by following script which executed by bookmarklet or browser extensions such as [SurfingKeys](https://github.com/brookhong/Surfingkeys).

```javascript
javascript:(function(){location.href=`sbe://${window.top.location.href}`})();
```
