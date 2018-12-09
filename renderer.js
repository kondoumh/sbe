const {electron, clipboard} = require("electron");
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

const tabGroup = new TabGroup();

const addTab = (url, closable) => {
  if (!url) {
    url = "https://scrapbox.io/";
  }
  const tab = tabGroup.addTab({
      title: "new tab",
      src: url,
      visible: true,
      active: true,
      closable: closable,
      ready: tab => {
        tab.webview.addEventListener("new-window", e => {
          if (e.url.indexOf("https://scrapbox.io/") !== -1) {
            addTab(e.url);
          } else {
            electron.shell.openExternal(e.url);
          }
        });
        tab.webview.addEventListener("page-title-updated", e => {
          tab.setTitle(e.title);
        });
        tab.on("active", (tab) => {
          console.log(tab.title);
        });
      }
  });
  return tab;
}

addTab("https://scrapbox.io/", false);

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