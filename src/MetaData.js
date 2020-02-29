
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
  let title, author, content, collaborators;
  const res = await fetch(pageUrl, { credentials: "include" });
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
  const res = await fetch(pageUrl, { credentials: "include" });
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
  const res = await fetch(pageUrl, { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();
    return data;
  }
  return "";
}

module.exports = {
  fetchPageInfo,
  fetchProjectMetrics,
  fetchPageText,
  renderLines,
  fetchPageData,
  fetchPageRawData
};
