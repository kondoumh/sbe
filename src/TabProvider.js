const TabGroup = require("electron-tabs");
const dragula = require("dragula");
const sbUrl = require("./UrlHelper");

class TabProvider {
  constructor() {
    this.tabGroup = new TabGroup({
      ready: tabGroup => {
        dragula([tabGroup.tabContainer], {
          direction: "horizontal"
        });
      }
    });
  }

  addTab (url, closable = true, projectName, fun) {
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
        fun();
        tab.ready = true;
        if (projectName) {
          tab.projectName = projectName;
        }
      }
    });
    return tab;
  }
  
  getPath(url) {
    let cururl = url;
    if (!cururl) {
      cururl = this.tabGroup.getActiveTab().webview.getURL();
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

  openUrl(url) {
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
  
  getPath(url) {
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

  isPage(url) {
    const path = getPath(url);
    return (path.length >= 2 && path[1] !== "");
  }

  getActiveWebView() {
    return this.tabGroup.getActiveTab().webview;
  }
}

module.exports = TabProvider;