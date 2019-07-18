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

module.exports = fetchPageInfo;