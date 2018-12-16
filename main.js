const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const Menu = electron.Menu;

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({ width: 1024, height: 800 });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "desktop.html"),
      protocol: "file:",
      slashes: true
    })
  );

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
        { type: "separator" },
        {
          label: "Search in window",
          accelerator: "CmdOrCtrl+F",
          click() {
            mainWindow.webContents.send("toggleSearch");
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
        { type: "separator" },
        { role: "reload" },
        { role: "toggledevtools" }
      ]
    }
  ];

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