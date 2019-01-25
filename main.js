const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const Menu = electron.Menu;
const Store = require("electron-store");

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
  mainWindow = new BrowserWindow({ width: width, height: height, x: x, y: y});

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "desktop.html"),
      protocol: "file:",
      slashes: true
    })
  );

  ['resize', 'move'].forEach(e => {
    mainWindow.on(e, () => {
        store.set('bounds', mainWindow.getBounds())
    });
  })
  initWindowMenu();

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
        { role: "delete" },
        { role: "selectall" },
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
        { type: "separator" },
        {
          label: "Search in window",
          accelerator: "CmdOrCtrl+F",
          click() {
            mainWindow.webContents.send("toggleSearch");
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
        { role: "about" },
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
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}