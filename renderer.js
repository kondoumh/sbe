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

const duplicateTab = () => {
  addTab(tabGroup.getActiveTab().webview.getURL(), true);
}

const copyUrl = () => {
  const url = tabGroup.getActiveTab().webview.getURL();
  clipboard.writeText(url);
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
        tab.webview.addEventListener("load-commit", e => {
          document.querySelector("#btn_back").disabled = !tab.webview.canGoBack();
          document.querySelector("#btn_forward").disabled = !tab.webview.canGoForward();
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
        tab.on("webview-ready", tab => {
          console.log("webview-ready");
          document.querySelector("#btn_back").disabled = !tab.webview.canGoBack();
          document.querySelector("#btn_forward").disabled = !tab.webview.canGoForward();
        });
        tabGroup.on("tab-active", (tab, tabGroup) => {
          console.log("tab-active");
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
    duplicateTab();
  })
  document.querySelector("#btn_copyurl").addEventListener('click', e => {
    copyUrl();
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

ipcRenderer.on("newTab", () => {
  addTab();
});

ipcRenderer.on("duplicateTab", () => {
  duplicateTab();
});

ipcRenderer.on("closeTab", () => {
  tabGroup.getActiveTab().close();
});

ipcRenderer.on("copyUrl", () => {
  copyUrl();
});

ipcRenderer.on("reload", () => {
  tabGroup.getActiveTab().webview.reload();
});