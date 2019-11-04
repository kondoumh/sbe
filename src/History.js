const MAX_HISTORY = 20;
const HISTORY_KEY = "histories"

let histories

function initialize() {
  historys = localStorage.getItem(HISTORY_KEY);
}

function inHistory(url) {
}

function addToHistory(url) {
}

module.exports = {
  initialize,
  inHistory,
  addToHistory
}
