const BASE_URL = "https://scrapbox.io/";
const LIST_PAGE = "page-list.html";

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

module.exports = {
  isUrl,
  inScrapbox,
  listPage,
  toTitle,
  BASE_URL,
  LIST_PAGE
};