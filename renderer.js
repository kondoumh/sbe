const {electron, shell, ipcRenderer, clipboard} = require("electron");
const TabGroup = require("electron-tabs");
const ElectronSearchText = require("electron-search-text");
const dragula = require("dragula");
const baseUrl = "https://scrapbox.io/";
const defaultIconUrl = baseUrl + "assets/img/favicon/favicon.ico";

const tabGroup = new TabGroup({
  ready: tabGroup => {
    dragula([tabGroup.tabContainer], {
      direction: "horizontal"
    })
  }
});

const addTab = (url, closable = true) => {
  if (!url) {
    url = baseUrl;
  }
  const tab = tabGroup.addTab({
      title: "new tab",
      src: url,
      visible: true,
      active: true,
      iconURL: defaultIconUrl,
      closable: closable,
      ready: tab => {
        tab.webview.addEventListener("new-window", e => {
          openUrl(e.url);
        });
        tab.webview.addEventListener("update-target-url", e => {
          showTargetPageTitle(e.url);
        });
        tab.webview.addEventListener("load-commit", e => {
          updateNavButtons(tab.webview);
          updateTab(tab, e.url);
        });
        tab.on("webview-ready", tab => {
          tab.searcher = new ElectronSearchText({
            target: ".etabs-view.visible",
            input: ".search-input",
            count: ".search-count",
            box: ".search-box",
            visibleClass: ".state-visible"
          });
          tab.ready = true;
        });
        tab.on("active", tab => {
          if (tab.ready) {
            updateNavButtons(tab.webview);
            resetSearchBoxCount();
          }
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
  document.querySelector("#tabgroup").addEventListener('dblclick', e => {
    duplicateTab();
  });
  document.querySelector("#open_url").addEventListener('change', e => {
    openUrl(e.target.value);
    document.querySelector("#open_url").value = ""
  });
};

ipcRenderer.on("toggleSearch", () => {
  const tab = tabGroup.getActiveTab();
  if (tab.searcher) {
    tab.searcher.emit("toggle");
  }
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

function goBack() {
  const webview = tabGroup.getActiveTab().webview;
  if (webview && webview.canGoBack()) {
    webview.goBack();
  }
}

function goForward() {
  const webview = tabGroup.getActiveTab().webview;
  if (webview && webview.canGoForward()) {
    webview.goForward();
  }
}

function duplicateTab() {
  addTab(tabGroup.getActiveTab().webview.getURL());
}

function copyUrl() {
  const url = tabGroup.getActiveTab().webview.getURL();
  clipboard.writeText(url);
}

function updateNavButtons(webview) {
  document.querySelector("#btn_back").disabled = !webview.canGoBack();
  document.querySelector("#btn_forward").disabled = !webview.canGoForward();
}

function updateTab(tab, url) {
  const path = url.substring(baseUrl.length).split("/");
  if (path.length > 1 && path[1].length > 0) {
    const iconUrl = baseUrl + "api/pages/" + path[0] + "/" + path[1] + "/icon";
    fetch(iconUrl, {
      credentials: "include"
    }).then(res => {
      if (res.status === 200) {
        tab.setIcon(iconUrl);
      }
      else {
        tab.setIcon(defaultIconUrl);
      }
      tab.setTitle(toTitle(path[1]) + " - " + toTitle(path[0]));
    });
  }
  else if (path.length > 1 && path[1].length === 0) {
    tab.setIcon(defaultIconUrl);
    tab.setTitle(toTitle(path[0]));
  }
}

function toTitle(path) {
  return decodeURI(path).replace(/_/g, " ");
}

function showTargetPageTitle(url) {
  let message = url !== "" ? decodeURI(url) : "ready";
  if (message.indexOf(baseUrl) !== -1) {
    message = message.substring(baseUrl.length);
  }
  document.querySelector("#statusbar").innerHTML = message;
}

function openUrl(url) {
  if (url.indexOf(baseUrl) !== -1) {
    addTab(url);
  }
  else {
    shell.openExternal(url);
  }
}

function resetSearchBoxCount() {
  document.querySelector("#search-count").innerHTML = "";
}