const electron = require("electron");
onload = () => {
  const webview = document.getElementById("webview");
  webview.addEventListener("new-window", e => {
    electron.shell.openExternal(e.url);
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

const container = document.getElementById("main");

ipcRenderer.on("toggleSearch", () => {
  searcher.emit("toggle");
});

const webview = document.getElementById("webview");

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
