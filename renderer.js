const electron = require("electron");

let webview

//const TabGroup = require("electron-tabs");

const goBack = () => {
  if (webview && webview.canGoBack()) {
    webview.goBack();
  }
}

const goForward = () => {
  if (webview && webview.canGoForward()) {
    webview.goForward();
  }
}

onload = () => {
  webview = document.getElementById("webview");

  webview.addEventListener("new-window", e => {
    electron.shell.openExternal(e.url);
  });
  document.querySelector("#btn_back").addEventListener('click', (event) => {
    goBack();
  });
  document.querySelector("#btn_forward").addEventListener('click', (event) => {
    goForward();
  });
  document.querySelector("#btn_reload").addEventListener('click', (event) => {
    webview.reload();
  });

  // let tabGroup = new TabGroup();
  // let tab = tabGroup.addTab({
  //     title: "Electron",
  //     src: "http://electron.atom.io",
  //     visible: true
  // });
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
  goBack();
});

ipcRenderer.on("goForward", () => {
  goForward();
});