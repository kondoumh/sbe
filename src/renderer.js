const { shell, ipcRenderer, clipboard } = require("electron");
const sbUrl = require("./UrlHelper");
const TabProvider = require("./TabProvider");
const ElectronSearchText = require("electron-search-text");
const Store = require("electron-store");
const getDate = require("./DateHelper");
const fetchPageInfo = require("./MetaData");
const MAX_FAV = 10;
let modalPageInfo;
let openItUrl;
let modalProjectInfo;

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
                getPageInfo(params.linkURL);
              },
              visible: params.linkURL && sbUrl.inScrapbox(params.linkURL) && tabGroup.isPage(params.linkURL)
            },
            {
              label: "Add to fav",
              click: () => { addToFav(tab.webview.getURL()); },
              visible: !params.linkURL && sbUrl.inScrapbox(tab.webview.getURL())
                && tabGroup.isPage(tab.webview.getURL()) && !inFavList(tab.webview.getURL())
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
                tabGroup.getActiveWebView().insertText(setHeading(params.selectionText, 1));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "Heading2",
              click: () => {
                tabGroup.getActiveWebView().insertText(setHeading(params.selectionText, 2));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "Heading3",
              click: () => {
                tabGroup.getActiveWebView().insertText(setHeading(params.selectionText, 3));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "heading4",
              click: () => {
                tabGroup.getActiveWebView().insertText(setHeading(params.selectionText, 4));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "body",
              click: () => {
                tabGroup.getActiveWebView().insertText(setBody(params.selectionText));
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

ipcRenderer.on("pasteUrlTitle", () => {
  const text = clipboard.readText("selection");
  if (!sbUrl.isUrl(text)) {
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
          tabGroup.getActiveWebView().insertText("[" + text + " " + title.replace(/[\r\[\]]/g, " ") + "]");
        } else {
          tabGroup.getActiveWebView().insertText("[" + text + " " + "no title]");
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

function inFavList(url) {
  const select = document.querySelector("#favorite");

  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === url) {
      return true;
    };
  }
  return false;
}

function addToFav(url) {
  const select = document.querySelector("#favorite");
  const option = document.createElement("option");
  const path = tabGroup.getPath(url);
  option.text = sbUrl.toTitle(path[1]) + " - " + path[0];
  option.value = url;
  select.add(option, 1);
  if (select.options.length > MAX_FAV + 1) {
    for (i = select.options.length; i > MAX_FAV; i--) {
      select.remove(i);
    }
  }

  const favs = [];
  for (i = 0; i < select.options.length; i++) {
    if (!sbUrl.inScrapbox(select.options[i].value)) continue;
    const item = { text: select.options[i].text, url: select.options[i].value };
    favs.push(item);
  }
  ipcRenderer.send("updateFavs", favs);
}

async function getPageInfo(url) {
  const path = tabGroup.getPath(url);
  const pageUrl = sbUrl.BASE_URL + "api/pages/" + path[0] + "/" + path[1];
  showStatusMessage("fetching page info...");
  let content = document.querySelector("#dialog-contents");
  let image = document.querySelector("#contents-image");
  const result = await fetchPageInfo(pageUrl, content, image);
  if (result) {
    openItUrl = url;
    createPageDialog().showModal();
    showStatusMessage("ready");
  }
  showStatusMessage("Cannot fetch page Info");
}

function createPageDialog() {
  if (!modalPageInfo) {
    modalPageInfo = document.querySelector("#page-info");
    modalPageInfo.addEventListener("click", (event) => {
      if (event.target === modalPageInfo) {
        modalPageInfo.close("cancelled");
      }
    });
    document.querySelector("#open-it").addEventListener("click", () => {
      modalPageInfo.close();
      addTab(openItUrl);
    });
  }
  return modalPageInfo;
}

function setHeading(text, level) {
  const re = /\[(\*+)\s([^\[\]]+)\]/;
  let slevel = "*".repeat(level);
  let result = text;
  if (!text.match(re)) {
    result = `[${slevel} ${text}]`;
  } else {
    const ar = re.exec(text);
    result = `[${slevel} ${ar[2]}]`;
  }
  return result;
}

function setBody(text) {
  const re = /\[(\*+)\s([^\[\]]+)\]/;
  let result = text;
  if (text.match(re)) {
    const ar = re.exec(text);
    result = ar[2];
  }
  return result;
}

async function showProjectActivities() {
  const path = tabGroup.getPath();
  const projectName = path[0];
  const pagesUrl = sbUrl.BASE_URL + "api/pages/" + projectName;

  const total = await fetchPostCount(pagesUrl);
  await collectProjectMetrics(pagesUrl, total, projectName);
}

async function fetchPostCount(pagesUrl) {
  const count = await fetch(pagesUrl, { credentials: "include" })
    .then(res => res.json()).then(data => data.count);
  return parseInt(count);
}

async function collectProjectMetrics(pagesUrl, totalCount, projectName) {
  let n = 0;
  let views = 0;
  let linked = 0;
  let pages = 0;
  for (count = 0; totalCount + 50 > count; count += 50) {
    const url = pagesUrl + "?skip=" + (count - 1) + "&limit=" + 50;
    await fetch(url, {
      credentials: "include"
    }).then(res => {
      if (res.status === 200) {
        res.json().then(data => {
          Object.keys(data.pages).forEach(key => {
            views += parseInt(data.pages[key].views);
            linked += parseInt(data.pages[key].linked);
            showStatusMessage("fetching.. " + pages++ + " / " + totalCount);
          });
        });
      } else {
        showStatusMessage(res.status);
        return;
      }
    }).catch(error => {
      showStatusMessage(error);
      return;
    });
  }
  const content = document.querySelector("#project-dialog-contents");
  content.innerHTML = `Project: ${projectName}<br>`
  content.innerHTML += `${getDate()}<br>`
  content.innerHTML += `Pages ${totalCount} : Views ${views} : Linked ${linked}`;
  showStatusMessage("ready");
  createProjectDialog().showModal();
}

function createProjectDialog() {
  if (!modalProjectInfo) {
    modalProjectInfo = document.querySelector("#project-info");
    modalProjectInfo.addEventListener("click", (event) => {
      if (event.target === modalProjectInfo) {
        modalProjectInfo.close("cancelled");
      }
    });
    document.querySelector("#copy-content").addEventListener("click", () => {
      const content = document.querySelector("#project-dialog-contents");
      clipboard.writeText(content.innerHTML.replace(/<br>/g, "\n"));
    });
  }
  return modalProjectInfo;
}
