const electron = require("electron");

let webview

onload = () => {
  webview = document.getElementById("webview");

  webview.addEventListener("new-window", e => {
    electron.shell.openExternal(e.url);
  });
  document.querySelector("#btn_back").addEventListener('click', (event) => {
    if (webview.canGoBack()) {
      webview.goBack();
    }
  });
  document.querySelector("#btn_forward").addEventListener('click', (event) => {
    if (webview.canGoForward()) {
      webview.goForward();
    }
  });
  document.querySelector("#btn_reload").addEventListener('click', (event) => {
    webview.reload();
  });
};

const { ipcRenderer } = require("electron");

const ElectronSearchText = require("electron-search-text");
const searcher = new ElectronSearchText({
  target: "#webview",
  input: ".search-input",
  count: ".search-count",
  box: ".search-box",
  visibleClass: ".state-visible"
});

ipcRenderer.on("toggleSearch", () => {
  searcher.emit("toggle");
});

ipcRenderer.on("goBack", () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

ipcRenderer.on("goForward", () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});