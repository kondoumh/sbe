import { app, screen, BrowserWindow, BrowserView, ipcMain, session, Menu, clipboard, shell, Notification } from 'electron';
import { fileURLToPath } from 'node:url';
import { compareVersions } from 'compare-versions';
import Store from 'electron-store';

import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sbUrl from './url-helper.mjs';
import toMarkdown from './markdown.mjs';
import { toHeading, toBodyText } from './format.mjs';

let mainWindow;
let topViewId;
let previousText;
let loginUser;
let updateInfo = new Map();
let store;

async function createWindow () {
  initializeStore();
  let {width, height, x, y} = store.get('bounds');
  const displays = screen.getAllDisplays();
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
  mainWindow.webContents.on('did-finish-load', async () => {
    await loadStartPage();
    if (process.env.RUN_MODE === 'test') {
      await loadFavPage();
    } else {
      await loadPage('https://scrapbox.io');
    }
  });
  await notifyUpdate();
}

function initializeStore() {
  store =new Store({
    defaults: {
      bounds: {
        width: 1024,
        height: 800,
      },
      boundsChild: {
        width: 1024,
        height: 800,
      },
      favs: [],
      history: [],
      edited: [],
      projects: []
    },
  });  
}

async function loadPageList() {
  const opened = openedPageList();
  if (opened > 0) {
    bringToTop(opened);
    return;
  }
  const view = new BrowserView({
    webPreferences: {
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
  if (page && page.id && page.persistent) {
    saveHistory(url, page);
    await beforeUpdate(url, page);
  }
  const projectPage = sbUrl.takeProjectPage(url);
  updateProjects(projectPage.project);
}

async function loadFavPage() {
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

async function loadHistoryPage() {
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

async function loadStartPage() {
  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'start-preload.js')
    }
  });
  mainWindow.addBrowserView(view);
  resizeView(view);
  view.webContents.loadFile(path.join(__dirname, 'start.html'));
  topViewId = view.webContents.id;
  prepareContextMenu(view.webContents);
  registerSearchAction(view);
  handleLinkEvent(view);
  mainWindow.webContents.send('add-page', view.webContents.id, 'Start', true, 'mdi-view-dashboard-variant-outline');
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
  view.webContents.setWindowOpenHandler(({ url }) => {
    openLink(url);
    return { action: 'deny' };
  });
  view.webContents.on('will-navigate', (e, url) => {
    if (!sbUrl.isLoginLink(url) && !sbUrl.inScrapbox(view.webContents.getURL())) {
      e.preventDefault();
      openLink(url);
    }
  });
  view.webContents.on('did-start-navigation', async (e, url, isInPlace) => {
    const currentUrl = view.webContents.getURL();
    if (sbUrl.inScrapbox(currentUrl)) {
      await afterUpdate(currentUrl, 'did-start-navigation');
    }
  });
  view.webContents.on('did-navigate-in-page', async (e, url) => {
    const page = await fetchPageData(url);
    if (page && page.id && page.persistent) {
      saveHistory(url, page);
      await beforeUpdate(url, page);
    }
    const projectPage = sbUrl.takeProjectPage(url);
    if (!projectPage.project) {
      return;
    }
    if (!loginUser) {
      const user = await fetchProjectUser(projectPage.project);
      if (user) {
        loginUser = user;
      }
    }
    updateProjects(projectPage.project);
  });
  view.webContents.on('update-target-url', (e, url) => {
    showMessage(decodeURIComponent(url));
  });
}

function updateProjects(projectName) {
  if (projectName) {
    const projects = new Set(store.get('projects'));
    projects.add(projectName);
    store.set('projects', Array.from(projects));
  }
}

async function openLink(url) {
  if (sbUrl.inScrapbox(url)) {
    await loadPage(url);
  } else {
    shell.openExternal(url);
  }
}

async function openLinkBackground(url) {
  const current = getTopView();
  await loadPage(url, false);
  mainWindow.setTopBrowserView(current);
  topViewId = current.webContents.id;
}

async function openNewWindow(url) {
  let {width, height, x, y} = store.get('boundsChild');
  const displays = screen.getAllDisplays();
  const activeDisplay = displays.find((display) => {
    return display.bounds.x <= x && display.bounds.y <= y &&
      display.bounds.x + display.bounds.width >= x &&
      display.bounds.y + display.bounds.height >= y;
  });
  if (!activeDisplay) {
    x = 0; y = 0; width = 1024, height = 800;
  }
  const newWindow = new BrowserWindow({
    //parent: mainWindow,
    show: false,
    width: width,
    height: height
  });
  ['resize', 'move'].forEach(e => {
    newWindow.on(e, () => {
      store.set('boundsChild', newWindow.getBounds());
    });
  });
  prepareContextMenu(newWindow.webContents);
  handleLinkEvent(newWindow);
  newWindow.setBounds({x: x, y: y, width: width, height: height});
  newWindow.loadURL(url);
  newWindow.show();
  newWindow.focus();
  const page = await fetchPageData(url);
  if (page && page.id && page.persistent) {
    await beforeUpdate(url, page);
  }
  newWindow.on('close', async (e) => {
    await afterUpdate(url, 'close-window');
    // refresh top view
    const activeViews = mainWindow.getBrowserViews();
    if (activeViews.length > 0) {
      activeViews[0].webContents.send('bring-to-top');
    }
  });
}

function resizeView(view) {
  const bound = mainWindow.getBounds();
  const height = process.platform !== 'win32' ? 180 : 215
  view.setBounds({ x: 0, y: 143, width: bound.width, height: bound.height - height });
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
          async click() {
            await loadFavPage();
          }
        },
        {
          label: 'History',
          async click() {
            await loadHistoryPage();
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
        },
        { type: 'separator' },
        {
          label: 'Reset Window Position',
          click() {
            resetWindowPosition();
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
  content.on('context-menu', (e, params) => {
    const menuTemplate = buildContextMenu(params, content);
    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    contextMenu.popup({ window: content });
  });
}

function buildContextMenu(params, content) {
  const menuTemplete = [
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
      label: 'Open in new window',
      click: () => { openNewWindow(params.linkURL); },
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
    { type: 'separator' },
    {
      label: `Search Google for '${params.selectionText.trim()}'`,
      click: () => {
        const url = new URL('https://www.google.com/search');
        url.searchParams.set('q', params.selectionText.trim());
        shell.openExternal(url.toString());
      },
      visible: params.selectionText.trim().length > 0
    },
    { type: 'separator' },
    {
      label: 'Copy Image',
      click: () => { content.copyImageAt(params.x, params.y); },
      visible: params.mediaType === 'image'
    },
    {
      label: 'Copy Image URL',
      click: () => { clipboard.writeText(params.srcURL); },
      visible: params.mediaType === 'image'
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
  ];
  return menuTemplete;
}

function goBack() {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused == mainWindow) {
    const view = getTopView();
    if (view && view.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  } else {
    if (focused.webContents.canGoBack()) {
      focused.webContents.goBack();
    }
  }
}

function goForward() {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused == mainWindow) {
    const view = getTopView();
    if (view && view.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  } else {
    if (focused.webContents.canGoForward()) {
      focused.webContents.goForward();
    }
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
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser-window-fucus');
      sendMessageToViews('browser-window-fucus');
    }
  });

  app.on('browser-window-blur', () => {
    mainWindow.webContents.send('browser-window-blur');
    sendMessageToViews('browser-window-blur');
  });

  app.on('before-quit', () => {
    BrowserWindow.getAllWindows().forEach(window => {
      if (window != mainWindow) {
        window.close();
      }
    });
  })
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

ipcMain.handle('send-title', (e, url, title) => {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused == mainWindow) {
    const views = getActiveViews();
    if (views.length > 0) {
      views[0].webContents.insertText('[' + url + ' ' + title + ']');
      showMessage('paste url : done');
    }
  } else {
    focused.webContents.insertText('[' + url + ' ' + title + ']');
  }
});

ipcMain.handle('active-project', async () => {
  const active = activeProject();
  return active;
});

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
  child.once('ready-to-show', () => {
    child.webContents.send('get-page-info', pageApi, url);
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

function resetWindowPosition() {
  mainWindow.setBounds({x: 0, y: 0, width: 1024, height: 800});
}

ipcMain.handle('open-it', async (e, url) => {
  await loadPage(url);
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

ipcMain.handle('unload-page', async (e, contentId) => {
  const views = mainWindow.getBrowserViews().filter(view => view.webContents.id === contentId);
  if (views.length > 0) {
    const currnetUrl = (views[0].webContents.getURL())
    await afterUpdate(currnetUrl, 'unload-page');
    mainWindow.removeBrowserView(views[0]);
  }
  const activeViews = mainWindow.getBrowserViews();
  if (activeViews.length > 0) {
    const idx = activeViews.length - 1;
    topViewId = activeViews[idx].webContents.id;
    mainWindow.webContents.send('bring-to-top', topViewId);
    activeViews[idx].webContents.send('bring-to-top');
  }
});

ipcMain.handle('open-pagelist', () => {
  const title = 'Pages:' + activeProject();
  mainWindow.webContents.send('query-title', title);
});

ipcMain.handle('open-favs-page', async () => {
  await loadFavPage();
});

ipcMain.handle('id-by-title', async (e, contentId) => {
  if (contentId < 0) {
    await loadPageList();
  }
});

ipcMain.handle('get-favs', async () => {
  const favs = store.get('favs');
  return favs;
});

ipcMain.handle('delete-fav', async (e, fav) => {
  const favs = store.get('favs');
  const deleted = favs.filter(item => item.url !== fav.url);
  store.set('favs', deleted);
  return deleted;
});

ipcMain.handle('open-history-page', async () => {
  await loadHistoryPage();
});

ipcMain.handle('get-history', async () =>{
  const history = store.get('history');
  return history;
});

ipcMain.handle('delete-history', async (e, item) => {
  const history = store.get('history');
  const deleted = history.filter(hist => hist.url !== item.url);
  store.set('history', deleted);
  return deleted;
});

ipcMain.handle('get-edited', async () =>{
  const edited = store.get('edited');
  return edited;
});

ipcMain.handle('get-version-info', async () => {
  let info = {
    version: app.getVersion(),
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

ipcMain.handle('fetch-post-count', async (e, projectName) => {
  const count = await fetchPostCount(projectName);
  return count;
});

ipcMain.handle('fetch-project-metrics', async (e, projectName, count, skip) => {
  const metrics = fetchProjectMetrix(projectName, count, skip);
  return metrics;
});

ipcMain.handle('get-projects', async () => {
  return store.get('projects');
});

ipcMain.handle('get-user', async () => {
  return loginUser;
});

ipcMain.handle('copy-to-clipboard', async (e, text) => {
  clipboard.writeText(text);
});

async function notifyUpdate() {
  try {
    const res = await fetch("https://api.github.com/repos/kondoumh/sbe/releases/latest");
    if (res.status === 200) {
      const data = await res.json();
      const latest = data.name;
      if (compareVersions(latest, app.getVersion()) === 1) {
        new Notification({ title: 'sbe', body: 'New version avilable!' }).on('click', () =>{
          shell.openExternal('https://github.com/kondoumh/sbe/releases/latest');
        }).show();
      }
    }
  } catch (err) {
    console.error("Version check failed: " + err.message);
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

function saveHistory(url, page) {
  const author = page.user.id === loginUser.id;
  const found = page.collaborators.find(item => item.id === loginUser.id);
  const contributed = found ? true: false;
  const projectPage = sbUrl.takeProjectPage(url);
  const addItem = {
    project: projectPage.project,
    page: decodeURIComponent(projectPage.page),
    url: url,
    id: page.id,
    author: author,
    contributed: contributed,
    created: page.created,
    updated: page.updated
  };
  const history = store.get('history');
  const removed = history.filter(item => item.id !== page.id && item.url !== url);
  removed.unshift(addItem);
  if (removed.length > 100) {
    removed.pop();
  }
  store.set('history', removed);
}

async function beforeUpdate(url, page) {
  if (!loginUser) {
    const user = await fetchProjectUser(projectPage.project);
    if (user) {
      loginUser = user;
    }
  }
  const author = page.user.id === loginUser.id;
  const found = page.collaborators.find(item => item.id === loginUser.id);
  const contributed = found ? true: false;
  updateInfo.set(page.id, { url: url, title: page.title, updated: page.updated, author: author, contributed: contributed });
}

async function afterUpdate(currentURL, event) {
  const after = await fetchPageData(currentURL);
  if (!after) return;
  if (!updateInfo.has(after.id)) return;
  const before = updateInfo.get(after.id);
  if (after.updated > before.updated) {
    const projectPage = sbUrl.takeProjectPage(currentURL);
    const author = after.user.id === loginUser.id;
    const found = after.collaborators.find(item => item.id === loginUser.id);
    const contributed = found ? true: false;
    const addItem = {
      project: projectPage.project,
      page: decodeURIComponent(projectPage.page),
      url: currentURL,
      id: after.id,
      author: author,
      contributed: contributed,
      created: after.created,
      updated: after.updated
    };
    const edited = store.get('edited');
    const filtered = edited.filter(item => item.id !== after.id);
    filtered.unshift(addItem);
    if (filtered.length > 100) {
      filtered.pop();
    }
    store.set('edited', filtered);
  }
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
  const endpoint = sbUrl.convertToPageApi(url);
  const sid = await getSid();
  const res = await fetch(endpoint, { headers: { cookie: sid } }).catch(error => {
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
  const res = await fetch(url, { headers: { cookie: sid } }).catch(error => {
    console.error(error);
  });
  let data;
  if (res.status === 200) {
    data = await res.json();
  }
  return data;
}

async function fetchProjectUser(projectName) {
  const sid = await getSid();
  const url = sbUrl.getUserUrl(projectName);
  const res = await fetch(url, { headers: { cookie: sid} }).catch(error => {
    console.error(error);
  });
  let data;
  if (res.status === 200) {
    data = await res.json();
    return { id : data.user.id, name: data.user.name, displayName: data.user.displayName };
  }
}

async function getSid() {
  let sid;
  const cookies = await session.defaultSession.cookies.get({ name: 'connect.sid' });
  if (cookies.length > 0) {
    sid = 'connect.sid=' + cookies[0].value;
  }
  return sid;
}

async function fetchPostCount(projectName) {
  const pagesUrl = sbUrl.pagesApi(projectName);
  const sid = await getSid();
  const res = await fetch(pagesUrl, { headers: { cookie: sid } }).catch(error => {
    console.error('error..' + error);
    return 0;
  });
  const data = await res.json();
  return parseInt(data.count);
}

async function fetchProjectMetrix(projectName, count, skip) {
  const pagesUrl = sbUrl.pagesApi(projectName);
  const sid = await getSid();
  const url = pagesUrl + '?skip=' + (count - 1) + '&limit=' + skip;
  const res = await fetch(url, { headers: { cookie: sid } }).catch(error => {
    console.error('error..' + error);
  });
  let views = 0;
  let linked = 0;
  if (res.status === 200) {
    const data = await res.json();
    Object.keys(data.pages).forEach(key => {
      views += parseInt(data.pages[key].views);
      linked += parseInt(data.pages[key].linked);
    });
    return { views: views, linked: linked, fetched: data.pages.length };
  }
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
