
async function fetchPageInfo(pageUrl) {
  let content, image;
  const res = await fetch(pageUrl, { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();

    content = data.title + " : by " + data.user.displayName;
    data.collaborators.forEach(collaborator => {
      content += ", " + collaborator.displayName;
    });
    content += "<hr>";
    content += renderLines(data.descriptions);
    content += "Views: " + data.views + ", Linked: " + data.linked + "<br>"
    image = data.image ? data.image : "";
  }
  return { content: content, image: image };
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

async function fetchPageText(pageUrl) {
  let title, author, content;
  const res = await fetch(pageUrl, { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();
    title = data.title;
    author = data.user.displayName;
    const lines = data.lines.slice(1).map(line => { return line.text; });
    content = renderLines(lines);
  }
  return { title: title, author: author, content: content };
}

function renderLines(lines) {
  let content = "";
  lines.forEach(line => {
    content += toHeadIfBold(line) + "<br>";
  });
  return content;
}

function toHeadIfBold(text) {
  const re = /^\[(\*+)\s(.+)\]$/;
  let result = text;
  if (re.test(text)) {
    const ar = re.exec(text);
    const count = ar[1].length;
    if (count === 1) {
      result = `<h4>${ar[2]}</h4>`;
    } else if (count === 2) {
      result = `<h3>${ar[2]}</h3>`;
    } else if (count === 3) {
      result = `<h2>${ar[2]}</h2>`;
    } else if (count >= 4) {
      result = `<h1>${ar[2]}</h1>`;
    }
  }
  return result;
}

async function fetchUserInfo(projectUrl) {
  let userId, userName;
  const res = await fetch(projectUrl + "/user", { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();
    userId = data.user.id;
    userName = data.user.displayName;
  }
  return { userId: userId, userName: userName };
}

async function fetchUserRelatedPage(projectUrl, userId, limit, pagination) {
  const url = `${projectUrl}/?skip=${limit*pagination}&limit=${limit}&sort=updated`;
  const res = await fetch(url, { credentials: "include" });
  let pages = [];
  if (res.status === 200) {
    const data = await res.json();
    pages = data.pages.filter(page => page.user.id === userId).map(page => page.title);
  }
  return pages;
}

module.exports = {
  fetchPageInfo,
  fetchProjectMetrics,
  fetchPageText,
  fetchUserInfo,
  fetchUserRelatedPage,
  renderLines
};