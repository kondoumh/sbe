const electron = require("electron");
const { app, Menu, BrowserWindow, ipcMain, webContents } = require("electron");
const fetch = require("node-fetch");

const path = require("path");
const url = require("url");
const Store = require("electron-store");
const openAboutWindow = require("about-window").default;
const contextMenu = require("electron-context-menu");
const sbUrl = require("./UrlHelper");

const store = new Store({
  defaults: {
    bounds: {
      width: 1024,
      height: 800,
    },
  },
});

let mainWindow;

const createWindow = async () => {
  let {width, height, x, y} = store.get("bounds");
  const displays = electron.screen.getAllDisplays();
  const activeDisplay = displays.find((display) => {
    return display.bounds.x <= x && display.bounds.y <= y &&
      display.bounds.x + display.bounds.width >= x &&
      display.bounds.y + display.bounds.height >= y;
  });
  if (!activeDisplay) {
    x = 0; y = 0; width = 1024, height = 800;
  }

  let options = {
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true, // electron-context-menu uses remote module
      contextIsolation: false
    },
    width: width, height: height, x: x, y: y
  };
  if (process.platform === "linux") {
    options = Object.assign({}, options, {
      icon: path.join(__dirname, "../icons/png/512x512.png"),
    });
  }
  mainWindow = new BrowserWindow(options);
  mainWindow.setBounds({x: x, y: y, width: width, height: height});

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "container.html"),
      protocol: "file:",
      slashes: true
    })
  );

  ['resize', 'move'].forEach(e => {
    mainWindow.on(e, () => {
        store.set('bounds', mainWindow.getBounds());
    });
  })
  initWindowMenu();
  mainWindow.webContents.once("dom-ready", () => {
    mainWindow.webContents.send("domReady");
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  try {
    const res = await fetch("https://api.github.com/repos/kondoumh/sbe/releases/latest");
    if (res.status === 200) {
      const data = await res.json();
      if (data.name !== "v" + app.getVersion()) {
        mainWindow.webContents.send("appUpdated");
      }
    }
  } catch (err) {
    console.error("request failed: " + err.message);
  }
};

app.allowRendererProcessReuse = false;

app.on("ready", createWindow);

app.setAsDefaultProtocolClient("sbe");

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("open-url", (e, url) => {
  if (mainWindow != null) {
    mainWindow.webContents.send("openUrlScheme", url.replace("sbe://", ""));
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (e, args) => {
    args.forEach(arg => {
      if (/sbe:\/\//.test(arg)) {
        mainWindow.webContents.send("openUrlScheme", arg.replace("sbe://", ""));
      }
    });

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

ipcMain.on("updateFavs", (e, arg) => {
  store.set("favs", arg);
});

function initWindowMenu() {
  const template = [
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        {
          label: "Paste [url title]",
          accelerator: "CmdOrCtrl+L",
          click() {
            mainWindow.webContents.send("pasteUrlTitle");
          }
        },
        { role: "delete" },
        { role: "selectall" },
        { type: "separator" },
        {
          label: "Insert [* 1]",
          accelerator: "CmdOrCtrl+1",
          click() {
            mainWindow.webContents.send("insertHeadline1");
          }
        },
        {
          label: "Insert [** 2]",
          accelerator: "CmdOrCtrl+2",
          click() {
            mainWindow.webContents.send("insertHeadline2");
          }
        },
        {
          label: "Insert [*** 3]",
          accelerator: "CmdOrCtrl+3",
          click() {
            mainWindow.webContents.send("insertHeadline3");
          }
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "go back",
          accelerator: "CmdOrCtrl+[",
          click() {
            mainWindow.webContents.send("goBack");
          }
        },
        {
          label: "go forward",
          accelerator: "CmdOrCtrl+]",
          click() {
            mainWindow.webContents.send("goForward");
          }
        },
        {
          label: "new tab",
          accelerator: "CmdOrCtrl+T",
          click() {
            mainWindow.webContents.send("newTab");
          }
        },
        {
          label: "duplicate tab",
          click() {
            mainWindow.webContents.send("duplicateTab");
          }
        },
        {
          label: "close tab",
          accelerator: "CmdOrCtrl+W",
          click() {
            mainWindow.webContents.send("closeTab");
          }
        },
        {
          label: "copy url",
          click() {
            mainWindow.webContents.send("copyUrl");
          }
        },
        {
          label: "reload",
          accelerator: "CmdOrCtrl+R",
          click() {
            mainWindow.webContents.send("reload");
          }
        },
        {
          label: "page list",
          click() {
            mainWindow.webContents.send("showPageList");
          }
        },
        {
          label: "Show linked pages",
          click() {
            mainWindow.webContents.send("showLinkedpages");
          }
        },
        {
          label: "Show user info",
          click() {
            mainWindow.webContents.send("showUserInfo");
          }
        },
        { type: "separator" },
        {
          label: "Search in window",
          accelerator: "CmdOrCtrl+F",
          click() {
            mainWindow.webContents.send("toggleSearch");
          }
        },
        { type: "separator" },
        {
          label: "Show project activties",
          click() {
            mainWindow.webContents.send("showProjectActivities")
          }
        }
      ]
    }
  ];

  if (!app.isPackaged) {
    template.unshift({
      label: "Debug",
      submenu: [
        { role: "forceReload"},
        { role: "toggledevtools" },
        { 
          label: "open devTools for Tab",
          click () {
            mainWindow.webContents.send("openDevToolsForTab");
          }
        }
      ]
    });
  }

  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        {
          label: "about sbe",
          click() {
            showAboutWindow();
          }
        },
        { type: "separator" },
        { role: "services", submenu: [] },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    });
  } else {
    template.push({
      label: "help",
      submenu: [
        {
          label: "about sbe",
          click() {
            showAboutWindow();
          }
        }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showAboutWindow() {
  openAboutWindow({
    icon_path: path.join(__dirname, "../icons/png/512x512.png"),
    copyright: 'Copyright (c) 2019 kondoumh',
    package_json_dir: path.join(__dirname, "../")
  });
}

ipcMain.on("tab-ready", (e, url) => {
  const contents = webContents.getAllWebContents();
  const content = contents.find(c => c.getURL() === url);
  contextMenu({
    window: content,
    prepend: (defaultActions, params, main) => [
      {
        label: 'Open',
        click: () => { mainWindow.webContents.send("openLink", params.linkURL); },
        visible: params.linkURL && (params.mediaType === "none" || params.mediaType === "image")
      },
      {
        label: 'Open in background',
        click: () => { mainWindow.webContents.send("openLinkBackground", params.linkURL); },
        visible: params.linkURL && sbUrl.inScrapbox(params.linkURL) && sbUrl.isScrapboxPage(params.linkURL)
      },
      {
        label: "Info",
        click: () => { mainWindow.webContents.send("showPageInfo", params.linkURL); },
        visible: params.linkURL && sbUrl.isScrapboxPage(params.linkURL)
      },
      {
        label: "Show linked pages",
        click: () => { mainWindow.webContents.send("showLinkedPages", params.linkURL); },
        visible: !params.linkURL && sbUrl.isScrapboxPage(content.getURL())
      },
      { type: "separator" },
      {
        label: "Add to favs",
        click: () => { mainWindow.webContents.send("addToFavs", content.getURL()); },
        visible: !params.linkURL && sbUrl.isScrapboxPage(content.getURL()) && !inFavs(content.getURL())
      },
      {
        label: "Remove from favs",
        click: () => { mainWindow.webContents.send("removeFromFavs", content.getURL()); },
        visible: !params.linkURL && sbUrl.isScrapboxPage(content.getURL()) && inFavs(content.getURL())
      },
      {
        label: "Copy as Markdown to clipboard",
        click: () => { mainWindow.webContents.send("copyAsMarkdown", content.getURL()); },
        visible: !params.linkURL && sbUrl.isScrapboxPage(content.getURL())
      },
      {
        label: "Copy as Markdown (Hatena blog notation) to clipboard",
        click: () => { mainWindow.webContents.send("copyAsHatenaMarkdown", content.getURL()); },
        visible: !params.linkURL && sbUrl.isScrapboxPage(content.getURL())
      },
      {
        label: 'Search Google for “{selection}”',
        click: () => {
          mainWindow.webContents.send("searchWithGoogle", params.selectionText.trim());
        },
        visible: params.selectionText.trim().length > 0
      },
    ]
  });
});

function inFavs(targetUrl) {
  const result = store.get("favs").find( ({ url })  => url === targetUrl );
  return result !== undefined;
}
