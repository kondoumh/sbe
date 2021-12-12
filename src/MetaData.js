const fetch = require("node-fetch");

async function fetchPageInfo(pageUrl) {
  let content, image;
  const res = await fetch(pageUrl, { headers: { cookie: connectSid } });
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
    const res = await fetch(url, { headers: { cookie: connectSid } }).catch(error => {
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
  const res = await fetch(pagesUrl, { headers: { cookie: connectSid } }).catch(error => {
    messageFunc("error.." + error);
    return 0;
  });
  const data = await res.json();
  return parseInt(data.count);
}

async function fetchPageText(pageUrl) {
  let title, author, content, collaborators;
  const res = await fetch(pageUrl, { headers: { cookie: connectSid } });
  if (res.status === 200) {
    const data = await res.json();
    title = data.title;
    author = data.user.displayName;
    collaborators = "";
    data.collaborators.forEach(collaborator => {
      collaborators += ", " + collaborator.displayName;
    });
    const lines = data.lines.slice(1).map(line => { return line.text; });
    content = renderLines(lines);
  }
  return { title: title, author: author, content: content, collaborators: collaborators };
}

async function fetchPageRawData(pageUrl) {
  const res = await fetch(pageUrl, { headers: { cookie: connectSid } });
  if (res.status == 200) {
    const data = await res.json();
    const lines = data.lines.slice(1).map(line => { return line.text; });
    return lines;
  }
  return null;
}

function renderLines(lines) {
  let content = "";
  lines.forEach(line => {
    content += decorateLine(line) + "<br>";
  });
  return content;
}

function decorateLine(line) {
  const reStrong = /\[(\*+)\s(.+)\]/g;
  const reIndent = /^(\s+)([^\s].+)/;
  let replaced = line.replace(reStrong, "<strong>$2</strong>");
  if (reIndent.test(replaced)) {
    const ar = reIndent.exec(replaced);
    const indent = "&ensp;".repeat(ar[1].length - 1);
    replaced = indent + "・" + ar[2];
  }
  return replaced;
}

async function fetchPageData(pageUrl) {
  const res = await fetch(pageUrl, { headers: { cookie: connectSid } });
  if (res.status === 200) {
    const data = await res.json();
    return data;
  }
  return "";
}

async function fetchUserInfo(projectUrl) {
  const user = {};
  const res = await fetch(projectUrl + "/user", { headers: { cookie: connectSid } });
  if (res.status === 200) {
    const data = await res.json();
    user.userId = data.user.id;
    user.name = data.user.name;
    user.displayName = data.user.displayName;
  }
  return user;
}

async function fetchProjectInfo(projectUrl, limit, pagination) {
  const url = `${projectUrl}/?skip=${limit*pagination}&limit=${limit}&sort=created`;
  const res = await fetch(url, { headers: { cookie: connectSid } });
  let data = {}
  if (res.status === 200) {
    data = await res.json();
  }
  return data;
}

async function fetchUserRelatedPages(projectUrl, userId, lastCreated) {
  const single = await fetchProjectInfo(projectUrl, 1, 0);
  const total = single.count;
  let result = [];
  for (page = 0; total + 100 > page * 100; page++) {
    const data = await fetchProjectInfo(projectUrl, 100, page);
    let pages = data.pages.filter(page => page.user.id === userId);
    if (lastCreated) {
      pages = pages.filter(page => page.created > lastCreated.created);
    }
    Array.prototype.push.apply(result, pages);
    showStatusMessage("Fetching... " + page * 100 + " / " + total + "<br>Found : " + result.length);
    if (lastCreated) {
      const already = data.pages.filter(page =>
        page.user.id === userId && page.created <= lastCreated.created);
      if (already.length > 0) {
        return result;
      }
    }
  }
  showStatusMessage("ready");
  return result;
}

module.exports = {
  fetchPageInfo,
  fetchProjectMetrics,
  fetchPageText,
  renderLines,
  fetchPageData,
  fetchPageRawData,
  fetchUserInfo,
  fetchUserRelatedPages
};
