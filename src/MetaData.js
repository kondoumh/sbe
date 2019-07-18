async function fetchPageInfo(pageUrl, content, image) {
  const res = await fetch(pageUrl, { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();

    content.innerHTML = "[" + data.title + "] : by " + data.user.displayName;
    data.collaborators.forEach(collaborator => {
      content.innerHTML += ", " + collaborator.displayName;
    });
    content.innerHTML += "<hr>";
    data.descriptions.forEach(description => {
      content.innerHTML += description + "<br>";
    });
    image.src = "";
    if (data.image) {
      image.src = data.image;
    }
    return true;
  }
  return false;
}

async function fetchProjectMetrics(pagesUrl, messageFunc) {
  const totalCount = await fetchPostCount(pagesUrl);
  let views = 0;
  let linked = 0;
  let pages = 0;
  for (count = 0; totalCount + 50 > count; count += 50) {
    const url = pagesUrl + "?skip=" + (count - 1) + "&limit=" + 50;
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 200) {
      const data = await res.json();
      Object.keys(data.pages).forEach(key => {
        views += parseInt(data.pages[key].views);
        linked += parseInt(data.pages[key].linked);
        messageFunc("fetching.. " + pages++ + " / " + totalCount);
      });
    }
  }
  return {views: views, linked: linked, totalCount: totalCount};
}

async function fetchPostCount(pagesUrl) {
  const res = await fetch(pagesUrl, { credentials: "include" });
  const data = await res.json();
  return parseInt(data.count);
}

module.exports = {
  fetchPageInfo,
  fetchProjectMetrics
};