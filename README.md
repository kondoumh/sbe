# sbe - Scrapbox in Electron

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
- Show project activities (total pages created, total views and linked)
### Utilities
- In-page search
- Open external url with web browser
- Search selected text on Google with web browser
- Add pages to fav list
- Open page from browsing history
- Copy article to clipboard as Markdown format
### Start Page (Cross-project dashboard)
- Projects: List visited Scrapbox projects
- Favs: List of favorite pages
- Timeline: Timeline view of viewed/edited pages
- Recently edited: List of recently edited pages
### Other
- Switch between dark and light modes to match your OS settings (UI parts other than Scrapbox contents)
- Open a page in a child window separate from the main window

![Screenshot](https://i.gyazo.com/5314e24354451448a0cb2aee1315f986.gif)

![Start Page](https://i.gyazo.com/382c181109dda1f15970d7a7c95a22b0.png)

## How to install
Download installer for each platform from [Releases](https://github.com/kondoumh/sbe/releases) and execute.

- macOS: sbe-`version`.dmg
- Windows: sbe.Setup.`version`.exe
- Linux: sbe-`version`.AppImage

## How to run with Electron
### requirement
Node.js v16

### run
git clone or download zip.

```
cd sbe
npm install
npm start
```

## How to build exectable binary

```
npm install
npm run pack
```

Binary will be created.

- macOS: `./dist/mac/sbe.app`
- Windows: `./dis/win-unpacked/sbe.exe`
- Linux: `.dist/linux/sbe.AppImage`


## How to build installer

```
npm install
npm run dist
```

Setup modules wil be created.
- macOS: `./dist/mac/sbe-<version>-universal.dmg`
- Windows: `./dist/win-unpacked/sbe.Setup.<version>.exe`
- Linux: `./dist/linux/sbe-<version>.AppImage`
