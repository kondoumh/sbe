const TabGroup = require("electron-tabs");
const dragula = require("dragula");
const sbUrl = require("./UrlHelper");
const { shell } = require("electron");

class TabProvider extends TabGroup {
  constructor() {
    super({
      ready: tabGroup => {
        dragula([tabGroup.tabContainer], {
          direction: "horizontal"
        });
      }
    });
  }

  getPath(url) {
    let cururl = url;
    if (!cururl) {
      cururl = this.getActiveWebView().getURL();
      if (!sbUrl.inScrapbox(cururl)) {
        this.getTabs().forEach(tab => {
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
      const path = this.getPath();
      addTab(sbUrl.getSearchUrl(path[0], url));
    }
  }
  
  isPage(url) {
    const path = this.getPath(url);
    return (path.length >= 2 && path[1] !== "");
  }

  goBack() {
    const webview = this.getActiveWebView();
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  }

  goForward() {
    const webview = this.getActiveWebView();
    if (webview && webview.canGoForward()) {
      webview.goForward();
    }
  }

  getActiveWebView() {
    return this.getActiveTab().webview;
  }

  updateTab(tab, url, projectName) {
    if (sbUrl.isPageList(tab.webview.getURL())) {
      if (!projectName) {
        projectName = tab.projectName;
      }
      tab.setTitle("page list - " + projectName);
      return;
    }
    if (sbUrl.isUserPage(tab.webview.getURL())) {
      if (!projectName) {
        projectName = tab.projectName;
      }
      tab.setTitle("user info - " + projectName);
      return;
    }
    const path = this.getPath(url);
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

  activateIfOpened(url) {
    let opened = false;
    this.eachTab(tab => {
      if (tab.webview.getURL() === url) {
        tab.activate();
        opened = true;
      }
    });
    return opened;
  }

  activateIfViewOpened(pageName, projectName) {
    let opened = false;
    this.eachTab(tab => {
      if (tab.webview.getURL().endsWith(pageName) && projectName === tab.projectName) {
        tab.activate();
        opened = true;
      }
    });
    return opened;
  }
}

module.exports = TabProvider;