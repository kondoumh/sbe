function getPageInfo(url, path) {
  const pageUrl = BASE_URL + "api/pages/" + path[0] + "/" + path[1];
  const res = await fetch(pageUrl, { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();
    let content = "[" + data.title + "] : by " + data.user.displayName;
    data.collaborators.forEach(collaborator => {
      content += ", " + collaborator.displayName;
    });
    content += "<hr>";
    data.descriptions.forEach(description => {
      content += description + "<br>";
    });
    return [content, data.image];
  }
}

module.exports = getPageInfo;