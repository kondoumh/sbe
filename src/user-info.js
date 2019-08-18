hoge();

function getPagesUrl(projectName) {
  return "https://scrapbox.io/api/pages/" + projectName;
}

async function hoge() {
  const user = await fetchUserInfo(getPagesUrl("kondoumh"));
  let data = user.name + " (" + user.displayName + ")" + "<br>";
  const pages = await fetchUserRelatedPages(getPagesUrl("kondoumh"), user.userId);
  data += "page created: " + pages.length + "<br>";

  pages.forEach(page => {
    data += page + "<br>";
  })

  const content = document.querySelector("#hoge");
  content.innerHTML = data;
  content.innerHTML += `<a href="https://scrapbox.io/kondoumh/Dev">Dev</a>`
}

async function fetchUserInfo(projectUrl) {
  const user = {};
  const res = await fetch(projectUrl + "/user", { credentials: "include" });
  if (res.status === 200) {
    const data = await res.json();
    user.userId = data.user.id;
    user.name = data.user.name;
    user.displayName = data.user.displayName;
  }
  return user;
}

async function fetchProjectInfo(projectUrl, limit, pagination) {
  const url = `${projectUrl}/?skip=${limit*pagination}&limit=${limit}&sort=updated`;
  const res = await fetch(url, { credentials: "include" });
  let data = {}
  if (res.status === 200) {
    data = await res.json();
  }
  return data;
}

async function fetchUserRelatedPages(projectUrl, userId) {
  const single = await fetchProjectInfo(projectUrl, 1, 0);
  const total = single.count;
  let result = [];
  for (page = 0; total + 100 > page * 100; page++) {
    const data = await fetchProjectInfo(projectUrl, 100, page);
    const pages = data.pages.filter(page => page.user.id === userId).map(page => page.title);
    Array.prototype.push.apply(result, pages);
  }
  return result;
}
