const MAX_HISTORY = 20;
const HISTORY_KEY = "histories"

let histories

function initializeHistory() {
  const select = document.querySelector("#history");
  select.addEventListener("change", e => {
    const url = select.value;
    if (!sbUrl.inScrapbox(url)) return;
    if (!tabGroup.activateIfOpened(url)) {
      tabGroup.openUrl(url);
    }
    select.selectedIndex = 0;
  });
  histories = ["https://scrapbox.io/kondoumh/Dev", "https://scrapbox.io/kondoumh/Portfolio"]; //localStorage.getItem(HISTORY_KEY);
  histories.forEach(item => {
    const option = document.createElement("option");
    option.text = item
    select.append(option);
  });
}

function inHistory(url) {
}

function addToHistory(url) {
}

module.exports = {
  initializeHistory,
  inHistory,
  addToHistory
}
