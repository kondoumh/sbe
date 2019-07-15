const { shell, ipcRenderer, clipboard } = require("electron");
const TabGroup = require("electron-tabs");
const sbUrl = require("./UrlHelper");
const ElectronSearchText = require("electron-search-text");
const dragula = require("dragula");
const Store = require("electron-store");
const getDate = require("./DateHelper");
const MAX_FAV = 10;
let modalPageInfo;
let openItUrl;
let modalProjectInfo;

const tabGroup = new TabGroup({
  ready: tabGroup => {
    dragula([tabGroup.tabContainer], {
      direction: "horizontal"
    });
  }
});

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
        openUrl(e.url);
      });
      tab.webview.addEventListener("update-target-url", e => {
        showTargetPageTitle(e.url);
      });
      tab.webview.addEventListener("load-commit", e => {
        if (sbUrl.inScrapbox(e.url) || sbUrl.listPage(e.url)) {
          updateNavButtons(tab.webview);
          updateTab(tab, e.url);
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
              click: () => { openUrl(params.linkURL); },
              visible: params.linkURL && (params.mediaType === "none" || params.mediaType === "image")
            },
            { type: "separator" },
            {
              label: "Info",
              click: () => {
                getPageInfo(params.linkURL);
              },
              visible: params.linkURL && sbUrl.inScrapbox(params.linkURL) && isPage(params.linkURL)
            },
            {
              label: "Add to fav",
              click: () => { addToFav(tab.webview.getURL()); },
              visible: !params.linkURL && sbUrl.inScrapbox(tab.webview.getURL())
                && isPage(tab.webview.getURL()) && !inFavList(tab.webview.getURL())
            },
            {
              label: "Search on Google \"" + params.selectionText + "\"",
              click: () => {
                url = "https://www.google.com/search?q=" + params.selectionText;
                openUrl(url);
              },
              visible: params.selectionText !== ""
            },
            {
              label: "Heading1",
              click: () => {
                tabGroup.getActiveTab().webview.insertText(setHeading(params.selectionText, 1));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "Heading2",
              click: () => {
                tabGroup.getActiveTab().webview.insertText(setHeading(params.selectionText, 2));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "Heading3",
              click: () => {
                tabGroup.getActiveTab().webview.insertText(setHeading(params.selectionText, 3));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "heading4",
              click: () => {
                tabGroup.getActiveTab().webview.insertText(setHeading(params.selectionText, 4));
              },
              visible: params.selectionText && !params.linkURL
            },
            {
              label: "body",
              click: () => {
                tabGroup.getActiveTab().webview.insertText(setBody(params.selectionText));
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
    showPageList();
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
    if (!opened) openUrl(url);
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

ipcRenderer.on("openDevToolsForTab", () => {
  tabGroup.getActiveTab().webview.openDevTools();
});
// end of IPC event handlers
/////////////////////////////////////////////////

function showPageList() {
  const path = getPath();
  localStorage.setItem("projectName", path[0]);
  addTab(sbUrl.LIST_PAGE, true, path[0]);
}

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
  if (!sbUrl.listPage(tabGroup.getActiveTab().webview.getURL())) {
    addTab(tabGroup.getActiveTab().webview.getURL());
  }
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
  if (sbUrl.listPage(tab.webview.getURL())) {
    let projectName = localStorage.getItem("projectName");
    if (!projectName) {
      projectName = tab.projectName;
    }
    tab.setTitle("page list - " + projectName);
    return;
  }
  const path = getPath(url);
  if (path.length > 1 && path[1].length > 0) {
    const newTitle = sbUrl.toTitle(path[1]) + " - " + sbUrl.toTitle(path[0]);
    if (tab.getTitle() === newTitle) return;
    tab.setTitle(newTitle);
    const iconUrl = sbUrl.getIconUrl(path[0], path[1]);
    fetch(iconUrl, {
      credentials: "include"
    }).then(res => {
      if (res.status === 200) {
        tab.setIcon(res.url);
      }
      else {
        tab.setIcon(sbUrl.DEFAULT_ICON_URL);
      }
    });
  }
  else if (path.length > 1 && path[1].length === 0) {
    tab.setIcon(sbUrl.DEFAULT_ICON_URL);
    tab.setTitle(sbUrl.toTitle(path[0]));
  }
}

function showTargetPageTitle(url) {
  let title = url !== "" ? sbUrl.toTitle(url) : "ready";
  if (sbUrl.inScrapbox(title)) {
    title = title.substring(sbUrl.BASE_URL.length);
  }
  showStatusMessage(title);
}

function openUrl(url) {
  if (sbUrl.inScrapbox(url)) {
    addTab(url);
  }
  else if (sbUrl.isUrl(url)) {
    shell.openExternal(url);
  } else {
    const path = getPath();
    addTab(sbUrl.getSearchUrl(path[0], url));
  }
}

function getPath(url) {
  let cururl = url;
  if (!cururl) {
    cururl = tabGroup.getActiveTab().webview.getURL();
    if (!sbUrl.inScrapbox(cururl)) {
      tabGroup.getTabs().forEach(tab => {
        if (sbUrl.inScrapbox(tab.webview.getURL())) {
          cururl = tab.webview.getURL();
        }
      })
    }
  }
  return cururl.substring(sbUrl.BASE_URL.length).split(/\/|#/);
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

function isPage(url) {
  const path = getPath(url);
  return (path.length >= 2 && path[1] !== "");
}

function addToFav(url) {
  const select = document.querySelector("#favorite");
  const option = document.createElement("option");
  const path = getPath(url);
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

function getPageInfo(url) {
  const path = getPath(url);
  const pageUrl = sbUrl.BASE_URL + "api/pages/" + path[0] + "/" + path[1];
  showStatusMessage("fetching page info...");
  fetch(pageUrl, {
    credentials: "include"
  }).then(res => {
    if (res.status === 200) {
      showStatusMessage("parsing page info...");
      res.json().then(data => {
        showStatusMessage("build page info...");
        const content = document.querySelector("#dialog-contents");
        content.innerHTML = "[" + data.title + "] : by " + data.user.displayName;
        data.collaborators.forEach(collaborator => {
          content.innerHTML += ", " + collaborator.displayName;
        });
        content.innerHTML += "<hr>";
        data.descriptions.forEach(description => {
          content.innerHTML += description + "<br>";
        });
        openItUrl = url;
        document.querySelector("#contents-image").src = "";
        if (data.image) {
          document.querySelector("#contents-image").src = data.image;
        }
        createPageDialog().showModal();
        showStatusMessage("ready");
      });
    }
  });
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
  const path = getPath();
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
