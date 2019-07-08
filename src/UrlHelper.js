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

module.exports = {
  isUrl, inScrapbox, listPage, BASE_URL, LIST_PAGE
};