const MAX_FAV = 10;

function initializeFavs() {
  const selectFav = document.querySelector("#favorite");
  selectFav.addEventListener("change", e => {
    const url = document.querySelector("#favorite").value;

    if (!sbUrl.inScrapbox(url)) return;
    if (!tabGroup.activateIfOpened(url)) {
      tabGroup.openUrl(url);
    }
    selectFav.selectedIndex = 0;
  });

  const favs = new Store().get("favs");
  favs.forEach(item => {
    const option = document.createElement("option");
    option.text = item.text;
    option.value = item.url;
    selectFav.append(option);
  });
}

function inFavs(url) {
  const select = document.querySelector("#favorite");

  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === url) {
      return true;
    };
  }
  return false;
}

function findUrl(url) {
  const select = document.querySelector("#favorite");

  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === url) {
      return i;
    };
  }
  return -1;
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
  return extractFavs(select)
}

function removeFromFavs(url) {
  const index = findUrl(url)
  if (index === -1) {
    return null
  }
  const select = document.querySelector("#favorite");
  select.remove(index)
  return extractFavs(select)
}

function extractFavs(select) {
  const favs = [];
  for (i = 0; i < select.options.length; i++) {
    if (!sbUrl.inScrapbox(select.options[i].value)) continue;
    const item = { text: select.options[i].text, url: select.options[i].value };
    favs.push(item);
  }
  return favs;
}

module.exports = {
  initializeFavs,
  inFavs,
  addToFavs,
  removeFromFavs
}
