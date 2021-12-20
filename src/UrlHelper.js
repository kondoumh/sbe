const sbUrl = {}

sbUrl.BASE_URL = "https://scrapbox.io/";
sbUrl.LIST_PAGE = "https://sbe-list.netlify.app/";
sbUrl.USER_PAGE = "user-info.html";
sbUrl.DEFAULT_ICON_URL = sbUrl.BASE_URL + "assets/img/favicon/favicon.ico";

sbUrl.isUrl = text => {
  return text.match(/^http(s)?:\/\/.+/);
}

sbUrl.inScrapbox = url => {
  return url.startsWith(sbUrl.BASE_URL);
}

sbUrl.isScrapboxPage = url => {
  if (!url.startsWith(sbUrl.BASE_URL)) {
    return false;
  }
  const path = url.substring(sbUrl.BASE_URL.length).split(/\/|#/);
  return (path.length >= 2 && path[1] !== "");
}

sbUrl.isPageList = url => {
  return !sbUrl.inScrapbox(url) && url.endsWith(sbUrl.LIST_PAGE);
}

sbUrl.isUserPage = url => {
  return !sbUrl.inScrapbox(url) && url.endsWith(sbUrl.USER_PAGE);
}

sbUrl.toTitle = path => {
  return decodeURIComponent(path).replace(/_/g, " ");
}

sbUrl.getPageUrl = (projectName, page) => {
  return sbUrl.BASE_URL + "api/pages/" + projectName + "/" + page;
}

sbUrl.getPagesUrl = (projectName) => {
  return sbUrl.BASE_URL + "api/pages/" + projectName;
}

sbUrl.getSearchUrl = (projectName, url) => {
  return sbUrl.BASE_URL + projectName + "/search/page?q=" + encodeURIComponent(url);
}

sbUrl.getIconUrl = (projectName, pageTitle) => {
  return sbUrl.BASE_URL + "api/pages/" + projectName + "/" + pageTitle + "/icon";
}

sbUrl.getPage = (projectName, pageTitle) => {
  return `https://scrapbox.io/${projectName}/${pageTitle}`;
}

module.exports = sbUrl;
