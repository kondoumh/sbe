const {shell, ipcRenderer, clipboard} = require("electron");
const TabGroup = require("electron-tabs");
const ElectronSearchText = require("electron-search-text");
const dragula = require("dragula");
const BASE_URL = "https://scrapbox.io/";
const DEFAULT_ICON_URL = BASE_URL + "assets/img/favicon/favicon.ico";
const LIST_PAGE = "list.html";
const Store = require("electron-store");
const MAX_HISTORY = 15;
const MAX_FAV = 10;

const tabGroup = new TabGroup({
  ready: tabGroup => {
    dragula([tabGroup.tabContainer], {
      direction: "horizontal"
    })
  }
});

const addTab = (url, closable = true) => {
  if (!url) {
    url = BASE_URL;
  }
  const tab = tabGroup.addTab({
      title: "new tab",
      src: url,
      visible: true,
      active: true,
      iconURL: DEFAULT_ICON_URL,
      closable: closable,
      ready: tab => {
        tab.webview.addEventListener("new-window", e => {
          openUrl(e.url);
        });
        tab.webview.addEventListener("update-target-url", e => {
          showTargetPageTitle(e.url);
        });
        tab.webview.addEventListener("load-commit", e => {
          if (inScrapbox(e.url) || e.url.indexOf(LIST_PAGE) !== -1) {
            updateNavButtons(tab.webview);
            updateTab(tab, e.url);
            updateHistory(e.url);
          }
        });
        tab.on("webview-ready", tab => {
          tab.searcher = new ElectronSearchText({
            target: ".etabs-view.visible",
            input: ".search-input",
            count: ".search-count",
            box: ".search-box",
            visibleClass: ".state-visible"
          });
          const contextMenu = require("electron-context-menu");
          contextMenu({
            window: tab.webview,
            prepend: (params, webview) => [
              {
                label: "Open",
                click: ()=> { openUrl(params.linkURL); },
                visible: params.linkURL && params.mediaType === "none"
              },
              {
                label: "Add to fav",
                click: () => { addToFav(tab.webview.getURL()); },
                visible: inScrapbox(tab.webview.getURL())
              },
              {
                label: "Search on Google \"" + params.selectionText + "\"",
                click: () => {
                  url = "https://www.google.com/search?q=" + params.selectionText;
                  openUrl(url);
                },
                visible: params.selectionText !== ""
              }
            ]
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

addTab(BASE_URL, false);

onload = () => {
  document.querySelector("#btn_back").addEventListener("click", e => {
    goBack();
  });
  document.querySelector("#btn_forward").addEventListener("click", e => {
    goForward();
  });
  document.querySelector("#btn_newtab").addEventListener("click", e => {
    addTab();
  });
  document.querySelector("#btn_duplicate").addEventListener("click", e => {
    duplicateTab();
  })
  document.querySelector("#btn_copyurl").addEventListener("click", e => {
    copyUrl();
  });
  document.querySelector("#btn_reload").addEventListener("click", e => {
    tabGroup.getActiveTab().webview.reload();
  });
  document.querySelector("#btn_titles").addEventListener("click", e => {
    const path = getPath();
    localStorage.setItem("projectName", path[0]);
    addTab(LIST_PAGE);
  });
  document.querySelector("#tabgroup").addEventListener("dblclick", e => {
    duplicateTab();
  });
  document.querySelector("#open_url").addEventListener("keypress", e => {
    const key = e.which || e.keyCode;
    if (key === 13) {
      openUrl(e.target.value);
    }
  });
  document.querySelector("#history").addEventListener("change", e => {
    const url = document.querySelector("#history").value;
    if (inScrapbox(url)) {
      openUrl(url);
    }
  });
  document.querySelector("#favorite").addEventListener("change", e => {
    const url = document.querySelector("#favorite").value;
    if (inScrapbox(url)) {
      openUrl(url);
    }
  });

  const select = document.querySelector("#history");
  const history = new Store().get("history");
  history.forEach(item => {
    const option = document.createElement("option");
    option.text = item.text;
    option.value = item.url;
    select.add(option, 0);
  });

  const selectFav = document.querySelector("#favorite");
  const favs = new Store().get("favs");
  favs.forEach(item => {
    const option = document.createElement("option");
    option.text = item.text;
    option.value = item.url;
    selectFav.append(option);
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

ipcRenderer.on("pasteUrlTitle", () => {
  const text = clipboard.readText("selection");
  if (!isUrl(text)) {
    showStatusMessage("Invalid URL. : " + text);
    return;
  }
  showStatusMessage("fetching document...");
  fetch(text, {
    credentials: "include"
  }).then(res => {
    if (res.status === 200) {
      showStatusMessage("parsing document...");
      res.text().then(body => {
        const doc = new DOMParser().parseFromString(body, "text/html");
        const title = doc.title;
        if (title) {
          tabGroup.getActiveTab().webview.insertText("[" + text + " " + title.replace(/[\r\[\]]/g, " ") + "]");
        } else {
          tabGroup.getActiveTab().webview.insertText("[" + text + " " + "no title]");
        }
        showStatusMessage("ready");
      });
    } else {
      showStatusMessage("can not fetch : status " + res.status);
    }
  }).catch(error => {
    showStatusMessage("error has occured. - " + error);
  })
});

ipcRenderer.on("insertHeadline1", () => {
  tabGroup.getActiveTab().webview.insertText("[* 1]");
});

ipcRenderer.on("insertHeadline2", () => {
  tabGroup.getActiveTab().webview.insertText("[** 2]");
});

ipcRenderer.on("insertHeadline3", () => {
  tabGroup.getActiveTab().webview.insertText("[*** 3]");
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
  if (tab.webview.getURL().indexOf(LIST_PAGE) !== -1) {
    tab.setTitle("page list");
    return;
  }
  const path = getPath(url);
  if (path.length > 1 && path[1].length > 0) {
    const newTitle = toTitle(path[1]) + " - " + toTitle(path[0]);
    if (tab.getTitle() === newTitle) return;
    tab.setTitle(newTitle);
    const iconUrl = BASE_URL + "api/pages/" + path[0] + "/" + path[1] + "/icon";
    fetch(iconUrl, {
      credentials: "include"
    }).then(res => {
      if (res.status === 200) {
        tab.setIcon(res.url);
      }
      else {
        tab.setIcon(DEFAULT_ICON_URL);
      }
    });
  }
  else if (path.length > 1 && path[1].length === 0) {
    tab.setIcon(DEFAULT_ICON_URL);
    tab.setTitle(toTitle(path[0]));
  }
}

function toTitle(path) {
  return decodeURIComponent(path).replace(/_/g, " ");
}

function showTargetPageTitle(url) {
  let title = url !== "" ? decodeURIComponent(url) : "ready";
  if (inScrapbox(title)) {
    title = title.substring(BASE_URL.length);
  }
  showStatusMessage(title);
}

function openUrl(url) {
  if (inScrapbox(url)) {
    addTab(url);
  }
  else if (isUrl(url)) {
      shell.openExternal(url);
  } else {
    const path = getPath();
    const searchUrl = BASE_URL + path[0] + "/search/page?q=" + encodeURIComponent(url);
    addTab(searchUrl);
  }
}

function getPath(url) {
  let cururl = url;
  if (!cururl) {
    cururl = tabGroup.getActiveTab().webview.getURL();
    if (!inScrapbox(cururl)) {
      tabGroup.getTabs().forEach(tab => {
        if (inScrapbox(tab.webview.getURL())) {
          cururl = tab.webview.getURL();
        }
      })
    }
  }
  return cururl.substring(BASE_URL.length).split(/\/|#/);
}

function isUrl(text) {
  return text.match(/^http(s)?:\/\/.+/);
}

function inScrapbox(url) {
  return url.indexOf(BASE_URL) === 0;
}

function resetSearchBoxCount() {
  document.querySelector("#search-count").innerHTML = "";
}

function showStatusMessage(message) {
  document.querySelector("#statusbar").innerHTML = message;
}

function updateHistory(url) {
  if (!inScrapbox(url) || url.indexOf(LIST_PAGE) !== -1) return;
  const path = getPath(url);
  if (path.length < 2 || path[1] === "") return;
  const select = document.querySelector("#history");
  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === url) {
      select.remove(i);
    };
  }
  const option = document.createElement("option");
  option.text = path[0] + " - " + toTitle(path[1]);
  option.value = url;
  select.add(option, 0);
  if (select.options.length > MAX_HISTORY) {
    select.remove(MAX_HISTORY);
  }

  const history = [];
  for (i = 0; i < select.options.length; i++) {
    const item = {text: select.options[i].text, url: select.options[i].value};
    history.push(item);
  }
  ipcRenderer.send("updateHistory", history);
}

function addToFav(url) {
  const path = getPath(url);
  if (path.length < 2 || path[1] === "") return;
  const select = document.querySelector("#favorite");

  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === url) {
      return;
    };
  }
  const option = document.createElement("option");
  option.text = path[0] + " - " + toTitle(path[1]);
  option.value = url;
  select.add(option, 0);
  if (select.options.length > MAX_FAV) {
    select.remove(MAX_FAV);
  }

  const favs = [];
  for (i = 0; i < select.options.length; i++) {
    const item = {text: select.options[i].text, url: select.options[i].value};
    favs.push(item);
  }
  ipcRenderer.send("updateFavs", favs);
}