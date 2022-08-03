function formatDate (timestamp) {
  let date = new Date()
  if (timestamp) {
    date.setTime(timestamp * 1000)
  }
  const params = {
    weekday: "short", year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: 'numeric', second: 'numeric',
    hour12: false
  }
  return date.toLocaleString(navigator.language, params)
}
