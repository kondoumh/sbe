const MAX_FAV = 10;

function inFavs(url) {
  const select = document.querySelector("#favorite");

  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === url) {
      return true;
    };
  }
  return false;
}

function addToFavs(url) {
  const select = document.querySelector("#favorite");
  const option = document.createElement("option");
  const path = tabGroup.getPath(url);
  option.text = sbUrl.toTitle(path[1]) + " - " + path[0];
  option.value = url;
  select.add(option, 1);
  if (select.options.length > MAX_FAV + 1) {
    for (i = select.options.length; i > MAX_FAV; i--) {
      select.remove(i);
    }
  }

  const favs = [];
  for (i = 0; i < select.options.length; i++) {
    if (!sbUrl.inScrapbox(select.options[i].value)) continue;
    const item = { text: select.options[i].text, url: select.options[i].value };
    favs.push(item);
  }
  return favs;
}

module.exports = {
  inFavs,
  addToFavs
}