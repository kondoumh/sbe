const MAX_HISTORY = 20;
const HISTORY_KEY = "histories"

let histories = [];

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
  const data = localStorage.getItem(HISTORY_KEY);
  histories = data ? JSON.parse(data) : [];
  histories.forEach(item => {
    const option = document.createElement("option");
    option.value = item.url;
    option.text = item.title;
    select.append(option);
  });
}

function addHistory(url, title, id) {
  if (!sbUrl.inScrapbox(url)) return;
  if (title.startsWith("new -")) return;

  const newitem = {url: url, title: title, id: id};
  histories = histories.filter(item => item.id !== newitem.id);
  if (histories.length >= MAX_HISTORY) {
    histories.splice(MAX_HISTORY - 1, 1);
  }
  histories.unshift(newitem);
  const select = document.querySelector("#history");
  select.options.length = 0;
  const top = document.createElement("option");
  top.text = "history:"
  select.append(top);
  select.selectedIndex = 0;
  histories.forEach(item => {
    const option = document.createElement("option");
    option.value = item.url;
    option.text = item.title;
    select.append(option);
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(histories));
}

module.exports = {
  initializeHistory,
  addHistory
}
