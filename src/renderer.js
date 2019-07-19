const { shell, ipcRenderer, clipboard } = require("electron");
const sbUrl = require("./UrlHelper");
const TabProvider = require("./TabProvider");
const ElectronSearchText = require("electron-search-text");
const Store = require("electron-store");
const getDate = require("./DateHelper");
const { fetchPageInfo, fetchProjectMetrics } = require("./MetaData");
const { inFavs, addToFavs } = require("./Favs");
const { toHeading, toBodyText} = require("./Heading");
const { createPageDialog, createProjectDialog } = require("./Dialogs");

const tabGroup = new TabProvider();

const addTab = (url, closable = true, projectName) => {
  if (!url) {
    url = sbUrl.BASE_URL;
  }
  const tab = tabGroup.addTab({
    title: "new tab",
    src: url,
    visible: true,
    active: true,
    iconURL: sbUrl.DEFAULT_ICON_URL,
    closable: closable,
    ready: tab => {
      tab.webview.addEventListener("dom-ready", e => {
        // Remove this once https://github.com/electron/electron/issues/14474 is fixed
        tab.webview.blur();
        tab.webview.focus();
      });
      tab.webview.addEventListener("new-window", e => {
        tabGroup.openUrl(e.url);
      });
      tab.webview.addEventListener("update-target-url", e => {
        showTargetPageTitle(e.url);
      });
      tab.webview.addEventListener("load-commit", e => {
        if (sbUrl.inScrapbox(e.url) || sbUrl.listPage(e.url)) {
          updateNavButtons(tab.webview);
          tabGroup.updateTab(tab, e.url, localStorage.getItem("projectName"));
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
          prepend: (actions, params, webview) => [
            {
              label: "Open",
              click: () => { tabGroup.openUrl(params.linkURL); },
              visible: params.linkURL && (params.mediaType === "none" || params.mediaType === "image")
            },
            { type: "separator" },
            {
              label: "Info",
              click: () => {
                showPageInfo(params.linkURL);
              },
              visible: params.linkURL && sbUrl.inScrapbox(params.linkURL) && tabGroup.isPage(params.linkURL)
            },
            {
              label: "Add to fav",
              click: () => {
                const favs = addToFavs(tab.webview.getURL());
                ipcRenderer.send("updateFavs", favs);
              },
              visible: !params.linkURL && sbUrl.inScrapbox(tab.webview.getURL())
                && tabGroup.isPage(tab.webview.getURL()) && !inFavs(tab.webview.getURL())
            },
            {
              label: "Search on Google \"" + params.selectionText + "\"",
              click: () => {
                url = "https://www.google.com/search?q=" + params.selectionText;
                tabGroup.openUrl(url);
              },
              visible: params.selectionText !== ""
            },
            {
              label: "Heading1",
              click: () => {
                tabGroup.getActiveWebView().insertText(toHeading(params.selectionText, 1));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "Heading2",
              click: () => {
                tabGroup.getActiveWebView().insertText(toHeading(params.selectionText, 2));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "Heading3",
              click: () => {
                tabGroup.getActiveWebView().insertText(toHeading(params.selectionText, 3));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "heading4",
              click: () => {
                tabGroup.getActiveWebView().insertText(toHeading(params.selectionText, 4));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "body",
              click: () => {
                tabGroup.getActiveWebView().insertText(toBodyText(params.selectionText));
              },
              visible: params.selectionText && !params.linkURL
            }
          ]
        });
        tab.ready = true;
        if (projectName) {
          tab.projectName = projectName;
        }
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

addTab(sbUrl.BASE_URL, false);

// IPC event handlers
/////////////////////////////////////////////////
ipcRenderer.on("domReady", () => {
  document.querySelector("#btn_back").addEventListener("click", e => {
    tabGroup.goBack();
  });
  document.querySelector("#btn_forward").addEventListener("click", e => {
    tabGroup.goForward();
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
    tabGroup.getActiveWebView().reload();
  });
  document.querySelector("#btn_titles").addEventListener("click", e => {
    showPageList();
  });
  document.querySelector("#tabgroup").addEventListener("dblclick", e => {
    duplicateTab();
  });
  document.querySelector("#open_url").addEventListener("keypress", e => {
    const key = e.which || e.keyCode;
    if (key === 13) {
      tabGroup.openUrl(e.target.value);
    }
  });
  document.querySelector("#favorite").addEventListener("change", e => {
    const url = document.querySelector("#favorite").value;

    if (!sbUrl.inScrapbox(url)) return;
    let opened = false;
    tabGroup.eachTab(currentTab => {
      if (currentTab.webview.getURL() === url) {
        currentTab.activate();
        opened = true;
      }
    });
    if (!opened) tabGroup.openUrl(url);
    selectFav.selectedIndex = 0;
  });

  const selectFav = document.querySelector("#favorite");
  const favs = new Store().get("favs");
  favs.forEach(item => {
    const option = document.createElement("option");
    option.text = item.text;
    option.value = item.url;
    selectFav.append(option);
  });
});

ipcRenderer.on("toggleSearch", () => {
  const tab = tabGroup.getActiveTab();
  if (tab.searcher) {
    tab.searcher.emit("toggle");
  }
});

ipcRenderer.on("goBack", () => {
  tabGroup.goBack();
});

ipcRenderer.on("goForward", () => {
  tabGroup.goForward();
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
  tabGroup.getActiveWebView().reload();
});

ipcRenderer.on("showPageList", () => {
  showPageList();
});

ipcRenderer.on("showProjectActivities", () => {
  showProjectActivities();
});

ipcRenderer.on("pasteUrlTitle", async () => {
  const text = clipboard.readText("selection");
  if (!sbUrl.isUrl(text)) {
    showStatusMessage("Invalid URL. : " + text);
    return;
  }
  showStatusMessage("fetching document...");
  const res = await fetch(text, { credentials: "include" }).catch(error => {
    showStatusMessage("error has occured. - " + error);
    return;
  });
  if (res.status === 200) {
    showStatusMessage("parsing document...");
    const body = await res.text();
    const doc = new DOMParser().parseFromString(body, "text/html");
    const title = doc.title;
    if (title) {
      tabGroup.getActiveWebView().insertText("[" + text + " " + title.replace(/[\r\[\]]/g, " ") + "]");
    } else {
      tabGroup.getActiveWebView().insertText("[" + text + " " + "no title]");
    }
    showStatusMessage("ready");
  } else {
    showStatusMessage("can not fetch : status " + res.status);
  }
});

ipcRenderer.on("insertHeadline1", () => {
  tabGroup.getActiveWebView().insertText("[* 1]");
});

ipcRenderer.on("insertHeadline2", () => {
  tabGroup.getActiveWebView().insertText("[** 2]");
});

ipcRenderer.on("insertHeadline3", () => {
  tabGroup.getActiveWebView().insertText("[*** 3]");
});

ipcRenderer.on("openDevToolsForTab", () => {
  tabGroup.getActiveWebView().openDevTools();
});
// end of IPC event handlers
/////////////////////////////////////////////////

function showPageList() {
  const path = tabGroup.getPath();
  localStorage.setItem("projectName", path[0]);
  addTab(sbUrl.LIST_PAGE, true, path[0]);
}

function duplicateTab() {
  if (!sbUrl.listPage(tabGroup.getActiveWebView().getURL())) {
    addTab(tabGroup.getActiveWebView().getURL());
  }
}

function copyUrl() {
  const url = tabGroup.getActiveWebView().getURL();
  clipboard.writeText(url);
}

function updateNavButtons(webview) {
  document.querySelector("#btn_back").disabled = !webview.canGoBack();
  document.querySelector("#btn_forward").disabled = !webview.canGoForward();
}

function showTargetPageTitle(url) {
  let title = url !== "" ? sbUrl.toTitle(url) : "ready";
  if (sbUrl.inScrapbox(title)) {
    title = title.substring(sbUrl.BASE_URL.length);
  }
  showStatusMessage(title);
}

function resetSearchBoxCount() {
  document.querySelector("#search-count").innerHTML = "";
}

function showStatusMessage(message) {
  document.querySelector("#statusbar").innerHTML = message;
}

async function showPageInfo(url) {
  const path = tabGroup.getPath(url);
  const pageUrl = sbUrl.BASE_URL + "api/pages/" + path[0] + "/" + path[1];
  showStatusMessage("fetching page info...");
  let content = document.querySelector("#dialog-contents");
  let image = document.querySelector("#contents-image");
  const result = await fetchPageInfo(pageUrl, content, image);
  if (result) {
    createPageDialog(url).showModal();
    showStatusMessage("ready");
  } else {
    showStatusMessage("Cannot fetch page Info");
  }
}

async function showProjectActivities() {
  const path = tabGroup.getPath();
  const projectName = path[0];
  const pagesUrl = sbUrl.BASE_URL + "api/pages/" + projectName;
  const { views, linked, totalCount } = await fetchProjectMetrics(pagesUrl, this.showStatusMessage);
  const data = {};
  data.projectName = projectName;
  data.date = getDate();
  data.totalCount = totalCount;
  data.views = views;
  data.linked = linked;
  showStatusMessage("ready");
  createProjectDialog(data).showModal();
}