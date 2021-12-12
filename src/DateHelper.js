function getDate(timestamp) {
  var dt = new Date();
  if (timestamp) {
    dt.setTime(timestamp * 1000);
  }
  var options = {
    weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "numeric", second: "numeric",
    hour12: false
  };
  return dt.toLocaleDateString(navigator.language, options);
}

module.exports = getDate;
