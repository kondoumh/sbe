const electron = require("electron");
const TabGroup = require("electron-tabs");

const goBack = () => {
  const webview = tabGroup.getActiveTab().webview;
  if (webview && webview.canGoBack()) {
    webview.goBack();
  }
}

const goForward = () => {
  const webview = tabGroup.getActiveTab().webview;
  if (webview && webview.canGoForward()) {
    webview.goForward();
  }
}

let tabGroup = new TabGroup();

const addTab = (title) => {
  let tab = tabGroup.addTab({
      title: title,
      src: "https://scrapbox.io/",
      visible: true,
      active: true,
      ready: tab => {
        tab.webview.addEventListener("new-window", e => {
          electron.shell.openExternal(e.url);
        });
        tab.webview.addEventListener("dom-ready", e => {
          console.log(e);
        });
      }
  });
  return tab;
}

addTab("Scrapbox1")

onload = () => {
  document.querySelector("#btn_back").addEventListener('click', (event) => {
    goBack();
  });
  document.querySelector("#btn_forward").addEventListener('click', (event) => {
    goForward();
  });
  document.querySelector("#btn_newtab").addEventListener('click', (event) => {
    addTab("Scrapbox2")
  });
  document.querySelector("#btn_reload").addEventListener('click', (event) => {
    webview.reload();
  });
};

const { ipcRenderer } = require("electron");

const ElectronSearchText = require("electron-search-text");
const searcher = new ElectronSearchText({
  target: ".etabs-view.visible",
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