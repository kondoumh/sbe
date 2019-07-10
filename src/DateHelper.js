function getDate() {
  var now = new Date();
  var options = {
    weekday: "short", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    hour12: false
  };
  return now.toLocaleDateString(navigator.language, options);
}

module.exports = getDate;