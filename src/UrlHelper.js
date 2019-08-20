const sbUrl = {}

sbUrl.BASE_URL = "https://scrapbox.io/";
sbUrl.LIST_PAGE = "page-list.html";
sbUrl.USER_PAGE = "user-info.html";
sbUrl.DEFAULT_ICON_URL = sbUrl.BASE_URL + "assets/img/favicon/favicon.ico";

sbUrl.isUrl = text => {
  return text.match(/^http(s)?:\/\/.+/);
}

sbUrl.inScrapbox = url => {
  return url.startsWith(sbUrl.BASE_URL);
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

module.exports = sbUrl;