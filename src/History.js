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
  histories = [
    {url : "https://scrapbox.io/kondoumh/Dev", title: "Dev - kondoumh"},
    {url : "https://scrapbox.io/kondoumh/Portfolio", title: "Portfolio - kondoumh"}
  ]; //localStorage.getItem(HISTORY_KEY);
  histories.forEach(item => {
    const option = document.createElement("option");
    option.value = item.url;
    option.text = item.title;
    select.append(option);
  });
}

function addHistory(url, title) {
  const newitem = {url: url, title: title};
  const idx = histories.findIndex(item => item.url === newitem.url);
  if (idx != -1) {
    histories.splice(idx, 1);
  }
  if (histories.length >= MAX_HISTORY) {
    histories.splice(MAX_HISTORY - 1, 1);
  }
  histories.unshift(newitem);
  const select = document.querySelector("#history");
  while (select.childNodes.length > 0) {
     select.removeChild(select.firstChild);
  }
  select.append({url: "", title: "history:"});
  select.selectedIndex = 0;
  histories.forEach(item => {
    const option = document.createElement("option");
    option.value = item.url;
    option.text = item.title;
    select.append(option);
  });
}

module.exports = {
  initializeHistory,
  addHistory
}
