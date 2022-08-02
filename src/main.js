const electron = require('electron');
const { app, BrowserWindow, BrowserView, ipcMain, session, Menu, clipboard, shell, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fetch = require('node-fetch');
const contextMenu = require('electron-context-menu');
const sbUrl = require('./url-helper');
const { toMarkdown } = require('./markdown');
const nfetch = require('node-fetch');
const { toHeading, toBodyText } = require('./format');
const compareVersions = require("compare-versions");

const store = new Store({
  defaults: {
    bounds: {
      width: 1024,
      height: 800,
    },
    favs: [],
    history: []
  },
});

let mainWindow;
let topViewId;
let previousText;

async function createWindow () {
  let {width, height, x, y} = store.get('bounds');
  const displays = electron.screen.getAllDisplays();
  const activeDisplay = displays.find((display) => {
    return display.bounds.x <= x && display.bounds.y <= y &&
      display.bounds.x + display.bounds.width >= x &&
      display.bounds.y + display.bounds.height >= y;
  });
  if (!activeDisplay) {
    x = 0; y = 0; width = 1024, height = 800;
  }

  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    width: width, height: height, x: x, y: y
  });
  mainWindow.setBounds({x: x, y: y, width: width, height: height});

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  prepareMenu();

  ['resize', 'move'].forEach(e => {
    mainWindow.on(e, () => {
      store.set('bounds', mainWindow.getBounds());
      mainWindow.getBrowserViews().forEach((view) => {
        resizeView(view);
      })
    });
  });
  mainWindow.webContents.on('did-finish-load', e => {
    loadPage('https://scrapbox.io');
  });
  await notifyUpdate();
}

function loadPageList() {
  const opened = openedPageList();
  if (opened > 0) {
    bringToTop(opened);
    return;
  }
  const view = new BrowserView({
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, 'pages-preload.js')
    }
  });
  mainWindow.addBrowserView(view);
  resizeView(view);
  view.webContents.loadFile(path.join(__dirname, 'pages.html'));
  topViewId = view.webContents.id;
  prepareContextMenu(view.webContents);
  registerSearchAction(view);
  handleLinkEvent(view);
  mainWindow.webContents.send('add-page', view.webContents.id, 'Pages', true, 'mdi-view-list');
}

async function loadPage(url, activate=true) {
  const view = new BrowserView();
  mainWindow.addBrowserView(view);
  resizeView(view);
  view.webContents.loadURL(url);
  topViewId = view.webContents.id;
  prepareContextMenu(view.webContents);
  registerSearchAction(view);
  handleLinkEvent(view);
  handleNavigation(view);
  mainWindow.webContents.send('add-page', view.webContents.id, sbUrl.toTitle(url), activate);
  const page = await fetchPageData(url);
  if (page && page.id) {
    saveHistory(url);
  }
}

function loadFavPage() {
  const opened = openedFavPage();
  if (opened > 0) {
    bringToTop(opened);
    return;
  }
  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'favs-preload.js')
    }
  });
  mainWindow.addBrowserView(view);
  resizeView(view);
  view.webContents.loadFile(path.join(__dirname, 'favs.html'));
  topViewId = view.webContents.id;
  prepareContextMenu(view.webContents);
  registerSearchAction(view);
  handleLinkEvent(view);
  mainWindow.webContents.send('add-page', view.webContents.id, 'Favs', true, 'mdi-star-outline');
}

function loadHistoryPage() {
  const opened = openedHistoryPage();
  if (opened > 0) {
    bringToTop(opened);
    return;
  }
  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'history-preload.js')
    }
  });
  mainWindow.addBrowserView(view);
  resizeView(view);
  view.webContents.loadFile(path.join(__dirname, 'history.html'));
  topViewId = view.webContents.id;
  prepareContextMenu(view.webContents);
  registerSearchAction(view);
  handleLinkEvent(view);
  mainWindow.webContents.send('add-page', view.webContents.id, 'History', true, 'mdi-history');
}

function registerSearchAction(view) {
  view.webContents.on('found-in-page', (e, result) => {
    if (result.activeMatchOrdinal) {
    }
    if (result.finalUpdate) {
    }
  });
}

function handleLinkEvent(view) {
  view.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    openLink(url);
  });
  view.webContents.on('will-navigate', (e, url) => {
    if (!sbUrl.isLoginLink(url)) {
      e.preventDefault();
      openLink(url);
    }
  });
  view.webContents.on('did-navigate-in-page', async (e, url) => {
    const page = await fetchPageData(url);
    if (page && page.id) {
      saveHistory(url, page.id);
    }
  });
}

function openLink(url) {
  if (sbUrl.inScrapbox(url)) {
    loadPage(url);
  } else {
    shell.openExternal(url);
  }
}

function openLinkBackground(url) {
  const current = getTopView();
  loadPage(url, false);
  mainWindow.setTopBrowserView(current);
  topViewId = current.webContents.id;
}

function resizeView(view) {
  const bound = mainWindow.getBounds();
  const height = process.platform !== 'win32' ? 180 : 215
  view.setBounds({ x: 0, y: 120, width: bound.width, height: bound.height - height });
}

function handleNavigation(view) {
  view.webContents.on('did-navigate-in-page', (e, url) => {
    const projectPage = sbUrl.takeProjectPage(url);
    mainWindow.webContents.send('navigation-finished', sbUrl.toTitle(url), view.webContents.id);
  });
}

function prepareMenu() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        {
          label: 'Paste [url title]',
          accelerator: 'CmdOrCtrl+L',
          click() { pasteUrl(); }
        },
        { role: 'delete' },
        { role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Insert [* 1]',
          accelerator: 'CmdOrCtrl+1',
          click() {
          }
        },
        {
          label: 'Insert [** 2]',
          accelerator: 'CmdOrCtrl+2',
          click() {
          }
        },
        {
          label: 'Insert [*** 3]',
          accelerator: 'CmdOrCtrl+3',
          click() {
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'go back',
          accelerator: 'CmdOrCtrl+[',
          click() { goBack(); }
        },
        {
          label: 'go forward',
          accelerator: 'CmdOrCtrl+]',
          click() { goForward(); }
        },
        {
          label: 'close tab',
          accelerator: 'CmdOrCtrl+W',
          click() { closeCurrentTab(); }
        },
        {
          label: 'copy url',
          click() {
            copyUrl();
          }
        },
        {
          label: 'reload',
          accelerator: 'CmdOrCtrl+R',
          click() {
            const view = getTopView();
            if (view) {
              view.webContents.reload();
            }
          }
        },
        {
          label: 'page list',
          click() {
            const title = 'Pages:' + activeProject();
            mainWindow.webContents.send('query-title', title);          
          }
        },
        {
          label: 'Favs',
          click() {
            loadFavPage();
          }
        },
        {
          label: 'History',
          click() {
            loadHistoryPage();
          }
        },
        {
          label: 'Show linked pages',
          click() {
          }
        },
        {
          label: 'Show user info',
          click() {
            mainWindow.webContents.send('showUserInfo');
          }
        },
        { type: 'separator' },
        {
          label: 'Search in window',
          accelerator: 'CmdOrCtrl+F',
          click() {
            mainWindow.webContents.send('focus-search-text');
          }
        },
        { type: 'separator' },
        {
          label: 'Show project activties',
          click() {
            openProjectInfoWindow();
          }
        }
      ]
    }
  ];

  if (!app.isPackaged) {
    template.unshift({
      label: 'Debug',
      submenu: [
        { role: 'forceReload'},
        {
          label: 'Open devtools',
          click () {
            mainWindow.webContents.openDevTools({ mode: 'detach'});
          }
        },
        { 
          label: 'Open devTools for Tab',
          click () {
            const view = getTopView();
            if (view) {
              view.webContents.openDevTools({ mode: 'detach' });
            }
          }
        }
      ]
    });
  }

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        {
          label: 'About sbe',
          click () {
            openAboutWindow();
          }
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  } else {
    template.push({
      label: 'help',
      submenu: [
        {
          label: 'About sbe',
          click () {
            openAboutWindow();
          }
        }
      ]
    })
  }
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function prepareContextMenu(content) {
  contextMenu({
    window: content,
    showSearchWithGoogle: false,
    prepend: (defaultActions, params) => [
      {
        label: 'Open',
        click: () => { openLink(params.linkURL); },
        visible: params.linkURL && (params.mediaType === 'none' || params.mediaType === 'image')
      },
      {
        label: 'Open in background',
        click: () => { openLinkBackground(params.linkURL); },
        visible: params.linkURL && sbUrl.inScrapbox(params.linkURL) && sbUrl.isPage(params.linkURL)
      },
      {
        label: 'Info',
        click: () => {
          openPageInfoWindow(params.linkURL);
        },
        visible: params.linkURL && sbUrl.isPage(params.linkURL)
      },
      {
        label: 'Show linked pages',
        click: () => { mainWindow.webContents.send('showLinkedPages', params.linkURL); },
        visible: !params.linkURL && sbUrl.isPage(content.getURL())
      },
      { type: 'separator' },
      {
        label: 'Add to favs',
        click: () => {
          const favs = store.get('favs');
          const page = sbUrl.takeProjectPage(content.getURL());
          const fav = { project: page.project, page: decodeURIComponent(page.page), url: content.getURL() }
          favs.push(fav);
          store.set('favs', favs);
          showMessage(`Added to favs : ${fav.project} - ${fav.page}`);
        },
        visible: !params.linkURL && sbUrl.isPage(content.getURL()) && !inFavs(content.getURL())
      },
      {
        label: 'Remove from favs',
        click: () => {
          const favs = store.get('favs');
          const removed = favs.filter(fav => fav.url !== content.getURL());
          store.set('favs', removed);
          showMessage('Removed from favs');
        },
        visible: !params.linkURL && sbUrl.isPage(content.getURL()) && inFavs(content.getURL())
      },
      {
        label: 'Copy as Markdown to clipboard',
        click: async () => {
          const result = await copyAsMarkdown(content.getURL());
          if (result) {
            showMessage('Copied as Markdown');
          }
        },
        visible: !params.linkURL && sbUrl.isPage(content.getURL())
      },
      {
        label: 'Copy as Markdown (Hatena blog notation) to clipboard',
        click: async () => {
          const result = await copyAsMarkdown(content.getURL(), true);
          if (result) {
            showMessage('Copiedas Markdown');
          }
        },
        visible: !params.linkURL && sbUrl.isPage(content.getURL())
      },
      {
        label: 'Search Google for “{selection}”',
        click: () => { shell.openExternal('https://www.google.com/search?q=' + params.selectionText.trim()); },
        visible: params.selectionText.trim().length > 0
      },
      {
        label: 'Heading1',
        click: () => { content.insertText(toHeading(params.selectionText, 1)); },
        visible: params.selectionText && !params.linkURL
      },
      {
        label: 'Heading2',
        click: () => { content.insertText(toHeading(params.selectionText, 2)); },
        visible: params.selectionText && !params.linkURL
      },
      {
        label: 'Heading3',
        click: () => { content.insertText(toHeading(params.selectionText, 3)); },
        visible: params.selectionText && !params.linkURL
      },
      {
        label: 'Heading4',
        click: () => { content.insertText(toHeading(params.selectionText, 4)); },
        visible: params.selectionText && !params.linkURL
      },
      {
        label: 'body',
        click: () => { content.insertText(toBodyText(params.selectionText)); },
        visible: params.selectionText && !params.linkURL
      }
    ]
  });
}

function goBack() {
  const view = getTopView();
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack();
  }
}

function goForward() {
  const view = getTopView();
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward();
  }
}

function closeCurrentTab() {
  mainWindow.webContents.send('close-current-tab')
}

function copyUrl() {
  const view = getTopView();
  if (view) {
    clipboard.writeText(view.webContents.getURL());
  }
}

async function pasteUrl() {
  const url = clipboard.readText('selection');
  if (!url.match(/^http(s)?:\/\/.+/)) {
    showMessage('Invalid URL. : ' + url);
    return;
  }
  mainWindow.webContents.send('show-message', '')
  const res = await fetch(url).catch(err => {
    showMessage('error has occured. - ' + err);
    return;
  });
  if (res.status === 200) {
    const body = await res.text();
    mainWindow.webContents.send('parse-html', url, body);
  } else {
    showMessage("cannot extract response body.");
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('browser-window-focus', () => {
    mainWindow.webContents.send('browser-window-fucus');
    sendMessageToViews('browser-window-fucus');
  });

  app.on('browser-window-blur', () => {
    mainWindow.webContents.send('browser-window-blur');
    sendMessageToViews('browser-window-blur');
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('debug-view', e => {
  const view = getTopView();
  if (view) {
    view.webContents.openDevTools({ mode: 'detach' });
  }
});

ipcMain.handle('debug-window', e => {
  mainWindow.webContents.openDevTools({ mode: 'detach'});
});

ipcMain.handle('get-cookie', async e => {
  let sid;
  const cookies = await session.defaultSession.cookies.get({ name: 'connect.sid' });
  if (cookies.length > 0) {
    sid = 'connect.sid=' + cookies[0].value;
  }
  return sid;
});

ipcMain.handle('send-title', (e, url, title) => {
  const views = getActiveViews();
  if (views.length > 0) {
    views[0].webContents.insertText('[' + url + ' ' + title + ']');
    showMessage('paste url : done');
  }
});

ipcMain.handle('active-project', async () => {
  const active = activeProject();
  return active;
});

ipcMain.handle('opened-projects', async () => {
  const projects = openedProjects();
  return projects;
})

function getActiveViews() {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.isFocused());
  return views;
}

function getTopView() {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.id === topViewId);
  return views[0];
}

function sendMessageToViews(message) {
  mainWindow.getBrowserViews().forEach(view => view.webContents.send(message));
}

function showMessage(message) {
  mainWindow.webContents.send('show-message', message);
}

function openPageInfoWindow(url) {
  const projectPage = sbUrl.takeProjectPage(url);
  const pageApi = sbUrl.convertToPageApi(url);
  const child = new BrowserWindow(
    {
      parent: mainWindow,
      title: 'Page Info : ' + sbUrl.decodeTitle(projectPage.page),
      webPreferences: {
        preload: path.join(__dirname, 'pageinfo-preload.js')
      }
    }
  );
  child.webContents.loadFile(path.join(__dirname, 'pageinfo.html'));
  child.webContents.on('did-finish-load', () => {
    child.webContents.send('showPageInfo', pageApi, url);
  })
  child.show();
  //child.webContents.openDevTools({ mode: 'detach' });
}

function openProjectInfoWindow() {
  const project = activeProject();
  const child = new BrowserWindow(
    {
      parent: mainWindow,
      title: 'Project Activities : ' + project,
      webPreferences: {
        sandbox: false,
        preload: path.join(__dirname, 'projectinfo-preload.js')
      }
    }
  );
  child.webContents.loadFile(path.join(__dirname, 'projectinfo.html'));
  child.show();
  //child.webContents.openDevTools({ mode: 'detach' });
}

function activeProject() {
  let project = '';
  mainWindow.getBrowserViews().forEach(view => {
    const url = view.webContents.getURL();
    if (sbUrl.inScrapbox(url)) {
      const prj = sbUrl.takeProjectPage(url);
      project = prj.project;
    }
  });
  return project;
}

function openedProjects() {
  const projects = new Set();
  mainWindow.getBrowserViews().forEach(view => {
    const url = view.webContents.getURL();
    if (sbUrl.inScrapbox(url)) {
      const prj = sbUrl.takeProjectPage(url);
      projects.add(prj.project);
    }
  })
  const arr = Array.from(projects);
  return arr;
}

ipcMain.handle('open-it', (e, url) => {
  loadPage(url);
});

ipcMain.handle('go-back', e => {
  goBack();
});

ipcMain.handle('go-forward', e => {
  goForward();
});

ipcMain.handle('search-start', (e, text) => {
  const contents = getTopView().webContents;
  if (contents) {
    search(contents, text);
  }
});

function search(contents, text) {
  if (previousText === text) {
    contents.findInPage(text, { findText: true });
  } else {
    previousText = text;
    contents.findInPage(text);
  }
}

ipcMain.handle('search-stop', e => {
  const contents = getTopView().webContents;
  contents.stopFindInPage('clearSelection');
});

ipcMain.handle('select-page', (e, contentId) => {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.id === contentId);
  if (views.length > 0) {
    mainWindow.setTopBrowserView(views[0]);
    topViewId = views[0].webContents.id;
    views[0].webContents.send('bring-to-top');
  }
});

ipcMain.handle('unload-page', (e, contentId) => {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.id === contentId);
  if (views.length > 0) {
    mainWindow.removeBrowserView(views[0]);
  }
  const activeViews = mainWindow.getBrowserViews();
  if (activeViews.length > 0) {
    topViewId = activeViews[0].webContents.id;
  }
});

ipcMain.handle('open-pagelist', () => {
  const title = 'Pages:' + activeProject();
  mainWindow.webContents.send('query-title', title);
});

ipcMain.handle('open-favs-page', () => {
  loadFavPage();
});

ipcMain.handle('id-by-title', (e, contentId) => {
  if (contentId < 0) {
    loadPageList();
  }
});

ipcMain.handle('get-favs', async () => {
  const favs = store.get('favs');
  return favs;
});

ipcMain.handle('open-history-page', () => {
  loadHistoryPage();
});

ipcMain.handle('get-history', async () =>{
  const history = store.get('history');
  return history;
});

ipcMain.handle('get-version-info', async () => {
  const packageInfo = require('../package.json');
  let info = {
    version: packageInfo.version,
    copyright: 'Copyright (c) 2019 kondoumh',
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    platform: process.platform,
    arch: process.arch
  }
  return info;
});

ipcMain.handle('fetch-page-info', async (e, url) => {
  const data = await fetchPageInfo(url);
  return data;
});

async function notifyUpdate() {
  try {
    const res = await fetch("https://api.github.com/repos/kondoumh/sbe/releases/latest");
    if (res.status === 200) {
      const data = await res.json();
      const latest = data.name.substring(1, data.name.length);
      if (compareVersions(latest, app.getVersion()) === 1) {
        new Notification({ title: 'sbe', body: 'New version avilable!' }).on('click', () =>{
          shell.openExternal('https://github.com/kondoumh/sbe/releases/latest');
        }).show();
      }
    }
  } catch (err) {
    console.error("request failed: " + err.message);
  }
}

function openedPageList() {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.getURL().endsWith('pages.html'));
  if (views.length > 0) {
    return views[0].webContents.id;
  }
  return -1;
}

function openedFavPage() {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.getURL().endsWith('favs.html'));
  if (views.length > 0) {
    return views[0].webContents.id;
  }
  return -1;
}

function openedHistoryPage() {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.getURL().endsWith('history.html'));
  if (views.length > 0) {
    return views[0].webContents.id;
  }
  return -1;
}

function bringToTop(contentId) {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.id === contentId);
  if (views.length > 0) {
    mainWindow.setTopBrowserView(views[0]);
    topViewId = views[0].webContents.id;
    mainWindow.webContents.send('bring-to-top', views[0].webContents.id);
    views[0].webContents.send('bring-to-top');
  }
}

function inFavs(url) {
  const favs = store.get('favs');
  const fav = favs.find(fav => fav.url === url);
  return fav !== undefined;
}

function saveHistory(url, pageId) {
  const page = sbUrl.takeProjectPage(url);
  const addItem = { project: page.project, page: decodeURIComponent(page.page), url: url, id: pageId };
  if (!page.page) {
    return;
  }
  if (page.page === 'new') { // If the user creates a page titled 'new', it will be'new_'
    return;
  }
  const history = store.get('history');
  const removed = history.filter(item => item.id !== pageId);
  removed.unshift(addItem);
  if (removed.length > 100) {
    removed.pop();
  }
  store.set('history', removed);
}

function openAboutWindow() {
  const child = new BrowserWindow(
    {
      parent: mainWindow,
      modal: true,
      title: 'About sbe',
      width: 380,
      height: 500,
      webPreferences: {
        preload: path.join(__dirname, 'about-preload.js')
      }
    }
  );
  child.webContents.loadFile(path.join(__dirname, 'about.html'));
  child.show();
}

async function fetchPageData(url) {
  let sid;
  const endpoint = sbUrl.convertToPageApi(url);
  const cookies = await session.defaultSession.cookies.get({ name: 'connect.sid' });
  if (cookies.length > 0) {
    sid = 'connect.sid=' + cookies[0].value;
  }
  const res = await nfetch(endpoint, { headers: { cookie: sid } }).catch(error => {
    console.error(error);
  });
  let data;
  if (res.status === 200) {
    data = await res.json();
  }
  return data;
}

async function fetchPageInfo(url) {
  const sid = await getSid();
  const res = await nfetch(url, { headers: { cookie: sid } }).catch(error => {
    console.error(error);
  });
  let data;
  if (res.status == 200) {
    data = await res.json();
  }
  return data;
}

async function getSid() {
  let sid;
  const cookies = await session.defaultSession.cookies.get({ name: 'connect.sid' });
  if (cookies.length > 0) {
    sid = 'connect.sid=' + cookies[0].value;
  }
  return sid;
}

async function copyAsMarkdown(url, hatena=false) {
  const data = await fetchPageData(url);
  if (data) {
    const lines = data.lines.slice(1).map(line => { return line.text; });
    const text = toMarkdown(lines, hatena);
    clipboard.writeText(text);
    return true;
  }
  return false;
}
