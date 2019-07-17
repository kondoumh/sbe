const TabGroup = require("electron-tabs");
const dragula = require("dragula");
const sbUrl = require("./UrlHelper");

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
      const path = getPath();
      addTab(sbUrl.getSearchUrl(path[0], url));
    }
  }
  
  isPage(url) {
    const path = this.getPath(url);
    return (path.length >= 2 && path[1] !== "");
  }

  getActiveWebView() {
    return this.getActiveTab().webview;
  }
}

module.exports = TabProvider;