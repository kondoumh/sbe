const {app, Menu, BrowserWindow, ipcMain} = require("electron");

const path = require("path");
const url = require("url");
const Store = require("electron-store");
const openAboutWindow = require("about-window").default;

const store = new Store({
  defaults: {
    bounds: {
      width: 1024,
      height: 800,
    },
  },
});

let mainWindow;

const createWindow = () => {
  const {width, height, x, y} = store.get("bounds");
  mainWindow = new BrowserWindow({
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true
    }
  });
  mainWindow.setBounds({x: x, y: y, width: width, height: height});

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "desktop.html"),
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
};

app.on("ready", createWindow);

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
        { role: "toggledevtools" }
      ]
    });
  }

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
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
    icon_path: __dirname + "/icons/png/512x512.png",
    copyright: 'Copyright (c) 2019 kondoumh',
    package_json_dir: __dirname,
  });
}