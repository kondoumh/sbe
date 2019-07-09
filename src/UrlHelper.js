const BASE_URL = "https://scrapbox.io/";
const LIST_PAGE = "page-list.html";
const DEFAULT_ICON_URL = BASE_URL + "assets/img/favicon/favicon.ico";

function isUrl(text) {
  return text.match(/^http(s)?:\/\/.+/);
}

function inScrapbox(url) {
  return url.startsWith(BASE_URL);
}

function listPage(url) {
  return !inScrapbox(url) && url.endsWith(LIST_PAGE);
}

function toTitle(path) {
  return decodeURIComponent(path).replace(/_/g, " ");
}

function getSearchUrl(projectName, url) {
  return BASE_URL + projectName + "/search/page?q=" + encodeURIComponent(url);
}

function getIconUrl(projectName, pageTitle) {
  return BASE_URL + "api/pages/" + projectName + "/" + pageTitle + "/icon";
}

module.exports = {
  isUrl,
  inScrapbox,
  listPage,
  toTitle,
  getSearchUrl,
  getIconUrl,
  BASE_URL,
  LIST_PAGE,
  DEFAULT_ICON_URL
};