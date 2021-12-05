const { ipcRenderer, clipboard } = require("electron");
const sbUrl = require("./UrlHelper");
const TabProvider = require("./TabProvider");
const ElectronSearchText = require("electron-search-text");
const Store = require("electron-store");
const getDate = require("./DateHelper");
const { fetchPageInfo, fetchProjectMetrics, fetchPageData, fetchPageRawData } = require("./MetaData");
const { initializeFavs, findInFavs, addToFavs, removeFromFavs } = require("./Favs");
const { toHeading, toBodyText} = require("./Heading");
const { createPageDialog, createProjectDialog, createLinksDialog, createPersonalDialog, createVersionsDialog } = require("./Dialogs");
const { initializeHistory, addHistory } = require("./History");
const { initializeProjects, addProject } = require("./Projects");
let { toMarkdown, hatenaBlogNotation } = require("./Markdown");
const fetch = require("node-fetch");

const tabGroup = new TabProvider();
let windowWidth = 800;
const TAB_MARGIN = 2;
const ICON_WIDTH = 20;
const CLOSE_BUTTON_WIDTH = 36;
let connectSid = "";

tabGroup.on("tab-added", (tab, group) => {
  resizeTabWidth();
});

tabGroup.on("tab-removed", (tab, group) => {
  resizeTabWidth();
});

function resizeTabWidth() {
  const titles = document.getElementsByClassName("etabs-tab-title");
  let available = (windowWidth / (titles.length + TAB_MARGIN)) - ICON_WIDTH - CLOSE_BUTTON_WIDTH;
  if (available <= 0) {
    available = 1;
  }
  const width = Math.trunc(Math.min(available, 200));
  let margin = ICON_WIDTH;
  if (available === 1) {
    margin = 0;
  }
  console.log(width);
  Array.prototype.forEach.call(titles, title => {
    title.style.maxWidth = `${width}px`;
    title.style.marginLeft = `${margin}px`;
  });
}

const addTab = (url, closable = true, projectName, active=true) => {
  if (!url) {
    url = sbUrl.BASE_URL;
  }
  const tab = tabGroup.addTab({
    title: "new tab",
    src: url,
    visible: true,
    active: active,
    iconURL: sbUrl.DEFAULT_ICON_URL,
    closable: closable,
    webviewAttributes: { preload: "./preload.js" },
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
      tab.webview.addEventListener("load-commit", async e => {
        if (sbUrl.inScrapbox(e.url) || sbUrl.isPageList(e.url) || sbUrl.isUserPage(e.url)) {
          updateNavButtons(tab.webview);
          tabGroup.updateTab(tab, e.url, localStorage.getItem("projectName"), connectSid);
          const path = tabGroup.getPath(tab.webview.getURL());
          if (tabGroup.isPage(tab.webview.getURL())) {
            const pageUrl = sbUrl.getPageUrl(path[0], path[1]);
            const page = await fetchPageData(pageUrl);
            if (page) {
              addHistory(tab.webview.getURL(), tab.title, page.id);
            }
          }
          addProject(path[0]);
        }
      });
      tab.webview.addEventListener("ipc-message", e => {
        switch(e.channel) {
          case "getTitle":
            console.log(e.args[0]);
            break;
          case "callback":
            console.log(e.args[0]);
            break;
        }
      });
      tab.webview.addEventListener("did-finish-load", () => {
        tab.webview.send("getTitle");
      })
      tab.on("webview-ready", tab => {
        tab.searcher = new ElectronSearchText({
          target: ".etabs-view.visible",
          input: ".search-input",
          count: ".search-count",
          box: ".search-box",
          visibleClass: ".state-visible"
        });
        ipcRenderer.send("tab-ready", tab.webview.getWebContentsId());
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
  initializeFavs();
  initializeProjects();
  initializeHistory();
});

ipcRenderer.on("appUpdated", () => {
  new Notification("Scrapbox in Electron (sbe)", {
    body: "New release available!"
  }).onclick = () => {
    tabGroup.openUrl("https://github.com/kondoumh/sbe/releases/latest");
  };
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

ipcRenderer.on("showLinkedpages", () => {
  showLinkedPages();
});

ipcRenderer.on("showProjectActivities", () => {
  showProjectActivities();
});

ipcRenderer.on("showUserInfo", () => {
  showUserInfo();
});

ipcRenderer.on("openUrlScheme", (event, url) => {
  if (!sbUrl.inScrapbox(url)) {
    showStatusMessage("Requested url is not scrapbox page.");
    return;
  }
  tabGroup.openUrl(url);
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

ipcRenderer.on("openLink", (event, url) => {
  tabGroup.openUrl(url);
});

ipcRenderer.on("openLinkBackground", (event, url) => {
  addTab(url, true, "", false);
});

ipcRenderer.on("showPageInfo", (event, url) => {
  showPageInfo(url);
});

ipcRenderer.on("showLinkedPages", (event, url) => {
  showLinkedPages();
});

ipcRenderer.on("addToFavs", (event, url) => {
  const favs = addToFavs(url);
  ipcRenderer.send("updateFavs", favs);
});

ipcRenderer.on("removeFromFavs", (event, url) => {
  const favs = removeFromFavs(url);
  ipcRenderer.send("updateFavs", favs);
});

ipcRenderer.on("copyAsMarkdown", () => {
  copyAsMarkdown();
});

ipcRenderer.on("copyAsHatenaMarkdown", () => {
  copyAsMarkdown(true);
});

ipcRenderer.on("searchWithGoogle", (event, text) => {
  tabGroup.openUrl("https://www.google.com/search?q=" + text);
});

ipcRenderer.on("heading1", (event, text) => {
  tabGroup.getActiveWebView().insertText(toHeading(text, 1));
});

ipcRenderer.on("heading2", (event, text) => {
  tabGroup.getActiveWebView().insertText(toHeading(text, 2));
});

ipcRenderer.on("heading3", (event, text) => {
  tabGroup.getActiveWebView().insertText(toHeading(text, 3));
});

ipcRenderer.on("heading4", (event, text) => {
  tabGroup.getActiveWebView().insertText(toHeading(text, 4));
});

ipcRenderer.on("body", (event, text) => {
  tabGroup.getActiveWebView().insertText(toBodyText(text));
});

ipcRenderer.on("openVersionsDialog", () => {
  const packageinfo = require('../package.json');
  let data = {
    version: packageinfo.version,
    copyright: 'Copyright (c) 2019 kondoumh',
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome
  }
  createVersionsDialog(data).showModal();
});

ipcRenderer.on("windowResized", (event, bounds) => {
  windowWidth = bounds.width
  resizeTabWidth();
});

ipcRenderer.on("connect-sid", (event, sid) => {
  connectSid = sid;
});

ipcRenderer.on("projectNameSet", (event, project) => {
  addTab(sbUrl.LIST_PAGE, true, project);
});
// end of IPC event handlers
/////////////////////////////////////////////////

function showPageList() {
  const path = tabGroup.getPath();
  if (!tabGroup.activateIfViewOpened(sbUrl.LIST_PAGE, path[0])) {
    localStorage.setItem("projectName", path[0]);
    ipcRenderer.send("showPageList", path[0]);
  }
}

function duplicateTab() {
  const url = tabGroup.getActiveWebView().getURL();
  if (!sbUrl.isPageList(url) && !sbUrl.isUserPage(url)) {
    addTab(tabGroup.getActiveWebView().getURL());
  }
}

function copyUrl() {
  const url = tabGroup.getActiveWebView().getURL();
  clipboard.writeText(decodeURIComponent(url));
}

function updateNavButtons(webview) {
  document.querySelector("#btn_back").disabled = !webview.canGoBack();
  document.querySelector("#btn_forward").disabled = !webview.canGoForward();
  const url = tabGroup.getActiveWebView().getURL();
  document.querySelector("#btn_copyurl").disabled = !sbUrl.inScrapbox(url);
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
  const pageUrl = sbUrl.getPageUrl(path[0], path[1]);
  showStatusMessage("fetching page info...");
  const { content, image } = await fetchPageInfo(pageUrl);
  const data = {};
  data.url = url;
  data.content = content;
  data.image = image;
  createPageDialog(data).showModal();
  showStatusMessage("ready");
}

async function showProjectActivities() {
  const path = tabGroup.getPath();
  const projectName = path[0];
  const pagesUrl = sbUrl.getPagesUrl(projectName);
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

async function showLinkedPages() {
  const path = tabGroup.getPath();
  if (path[1] === "") return;
  const url = sbUrl.getPageUrl(path[0], path[1]);
  const res = await fetch(url, { headers: { cookie: connectSid } });
  const data = await res.json();
  if (data.relatedPages.links1hop.length > 0) {
    createLinksDialog(data, path).showModal();
  } else {
    showStatusMessage("No links of this page");
  }
}

async function showUserInfo() {
  const path = tabGroup.getPath();
  if (!tabGroup.activateIfViewOpened(sbUrl.USER_PAGE, path[0])) {
    localStorage.setItem("projectName", path[0]);
    addTab("user-info.html", true, path[0]);
  }
}

async function copyAsMarkdown(hatena = false) {
  const path = tabGroup.getPath();
  if (path[1] === "") return;
  const lines = await fetchPageRawData(sbUrl.getPageUrl(path[0], path[1]));
  const text = toMarkdown(lines, hatena);
  clipboard.writeText(text);
  showStatusMessage("Copied markdown to clipboard.");
}
