async function fetchPageInfo(pageUrl) {
  let content, image;
  const res = await fetch(pageUrl, { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();

    content = "[" + data.title + "] : by " + data.user.displayName;
    data.collaborators.forEach(collaborator => {
      content += ", " + collaborator.displayName;
    });
    content += "<hr>";
    data.descriptions.forEach(description => {
      content += description + "<br>";
    });
    content += "Views: " + data.views + ", Linked: " + data.linked + "<br>"
    image = data.image ? data.image : "";
  }
  return { content: content, image: image }
}

async function fetchProjectMetrics(pagesUrl, messageFunc) {
  const totalCount = await fetchPostCount(pagesUrl);
  let views = 0;
  let linked = 0;
  let pages = 0;
  for (count = 0; totalCount + 50 > count; count += 50) {
    const url = pagesUrl + "?skip=" + (count - 1) + "&limit=" + 50;
    const res = await fetch(url, { credentials: "include" }).catch(error => {
      messageFunc("error.." + error);
    });
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

async function fetchPostCount(pagesUrl, messageFunc) {
  const res = await fetch(pagesUrl, { credentials: "include" }).catch(error => {
    messageFunc("error.." + error);
    return 0;
  });
  const data = await res.json();
  return parseInt(data.count);
}

module.exports = {
  fetchPageInfo,
  fetchProjectMetrics
};