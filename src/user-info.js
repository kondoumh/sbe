hoge();

function getPagesApiUrl(projectName) {
  return "https://scrapbox.io/api/pages/" + projectName;
}

function getPageLink(projectName, title) {
  return `<a href="https://scrapbox.io/${projectName}/${title}" target="_blank">${title}</a>`;
}

async function hoge() {
  const content = document.querySelector("#hoge");
  content.innerHTML = "Fetching...";

  const user = await fetchUserInfo(getPagesApiUrl("kondoumh"));
  let data = user.name + " (" + user.displayName + ")" + "<br>";
  const pages = await fetchUserRelatedPages(getPagesApiUrl("kondoumh"), user.userId);
  data += "page created: " + pages.length + "<br><hr>";

  pages.forEach(page => {
    data += getDate(page.created) + " : " + getPageLink("kondoumh", page.title) + "<br>";
  });

  content.innerHTML = data;
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
    const pages = data.pages.filter(page => page.user.id === userId);
    Array.prototype.push.apply(result, pages);
  }
  return result;
}

function getDate(timestamp) {
  const date = new Date()
  date.setTime(timestamp * 1000)
  const options = {
    weekday: "short", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    hour12: false
  };
  return date.toLocaleDateString(navigator.language, options);
}