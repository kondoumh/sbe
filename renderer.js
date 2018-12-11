const {electron, shell, ipcRenderer, clipboard} = require("electron");
const TabGroup = require("electron-tabs");
const ElectronSearchText = require("electron-search-text");
const baseUrl = "https://scrapbox.io/";

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

let searcher

const tabGroup = new TabGroup();

const addTab = (url, closable) => {
  if (!url) {
    url = baseUrl;
  }
  const tab = tabGroup.addTab({
      title: "new tab",
      src: url,
      visible: true,
      active: true,
      closable: closable,
      ready: tab => {
        tab.webview.addEventListener("new-window", e => {
          if (e.url.indexOf(baseUrl) !== -1) {
            addTab(e.url);
          } else {
            shell.openExternal(e.url);
          }
        });
        tab.webview.addEventListener("page-title-updated", e => {
          tab.setTitle(e.title);
        });
        tab.webview.addEventListener("update-target-url", e => {
          let message = e.url !== "" ? decodeURI(e.url) : "ready";
          if (message.indexOf(baseUrl) !== -1) {
            message = message.substring(baseUrl.length);
          }
          document.querySelector("#statusbar").innerHTML = message;
        });
        tab.on("active", tab => {
          searcher = new ElectronSearchText({
            target: ".etabs-view.visible",
            input: ".search-input",
            count: ".search-count",
            box: ".search-box",
            visibleClass: ".state-visible"
          });
        });
      }
  });
  return tab;
}

addTab(baseUrl, false);

onload = () => {
  document.querySelector("#btn_back").addEventListener('click', e => {
    goBack();
  });
  document.querySelector("#btn_forward").addEventListener('click', e => {
    goForward();
  });
  document.querySelector("#btn_newtab").addEventListener('click', e => {
    addTab();
  });
  document.querySelector("#btn_duplicate").addEventListener('click', e => {
    addTab(tabGroup.getActiveTab().webview.getURL(), true);
  })
  document.querySelector("#btn_copyurl").addEventListener('click', e => {
    const url = tabGroup.getActiveTab().webview.getURL();
    clipboard.writeText(url);
  });
  document.querySelector("#btn_reload").addEventListener('click', e => {
    tabGroup.getActiveTab().webview.reload();
  });
};

ipcRenderer.on("toggleSearch", () => {
  searcher.emit("toggle");
});

ipcRenderer.on("goBack", () => {
  goBack();
});

ipcRenderer.on("goForward", () => {
  goForward();
});