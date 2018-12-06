const electron = require("electron");
const TabGroup = require("electron-tabs");

let webview

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

let tabGroup = new TabGroup();
let tab = tabGroup.addTab({
    title: "Electron",
    src: "https://scrapbox.io/",
    visible: true,
    active: true
});

onload = () => {
  
  //webview = document.getElementById("webview");

  // webview.addEventListener("new-window", e => {
  //   electron.shell.openExternal(e.url);
  // });
  // document.querySelector("#btn_back").addEventListener('click', (event) => {
  //   goBack();
  // });
  // document.querySelector("#btn_forward").addEventListener('click', (event) => {
  //   goForward();
  // });
  // document.querySelector("#btn_reload").addEventListener('click', (event) => {
  //   webview.reload();
  // });
};

// const { ipcRenderer } = require("electron");

// const ElectronSearchText = require("electron-search-text");
// const searcher = new ElectronSearchText({
//   target: "#webview",
//   input: ".search-input",
//   count: ".search-count",
//   box: ".search-box",
//   visibleClass: ".state-visible"
// });

// ipcRenderer.on("toggleSearch", () => {
//   searcher.emit("toggle");
// });

// ipcRenderer.on("goBack", () => {
//   goBack();
// });

// ipcRenderer.on("goForward", () => {
//   goForward();
// });