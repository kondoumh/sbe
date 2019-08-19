let projectName;

window.onload = () => {
  if (!projectName) {
    projectName = sessionStorage.getItem("projectName")
    if (!projectName) {
      projectName = localStorage.getItem("projectName")
      sessionStorage.setItem("projectName", projectName)
      localStorage.removeItem("projectName")
    }
  }
  showUserInfo();
};

async function showUserInfo() {
  const content = document.querySelector("#user-info");
  content.innerHTML = "Fetching...";

  const user = await fetchUserInfo(getPagesApiUrl(projectName));
  let data = user.name + " (" + user.displayName + ")" + "<br>";
  const pages = await fetchUserRelatedPages(getPagesApiUrl(projectName), user.userId, content);
  data += "page created: " + pages.length + "<br><hr>";

  pages.forEach(page => {
    data += getDate(page.created) + " : " + getPageLink(projectName, page.title) + "<br>";
  });
  content.innerHTML = data;
}

function getPagesApiUrl(projectName) {
  return "https://scrapbox.io/api/pages/" + projectName;
}

function getPageLink(projectName, title) {
  return `<a href="https://scrapbox.io/${projectName}/${title}" target="_blank">${title}</a>`;
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

async function fetchUserRelatedPages(projectUrl, userId, content) {
  const single = await fetchProjectInfo(projectUrl, 1, 0);
  const total = single.count;
  let result = [];
  for (page = 0; total + 100 > page * 100; page++) {
    const data = await fetchProjectInfo(projectUrl, 100, page);
    const pages = data.pages.filter(page => page.user.id === userId);
    Array.prototype.push.apply(result, pages);
    content.innerHTML = "Fetching... " + page * 100 + " / " + total + "<br>Found : " + result.length;
  }
  return result;
}

function getDate(timestamp) {
  const dt = new Date();
  dt.setTime(timestamp * 1000);
  const year = dt.getFullYear();
  const month = (dt.getMonth() + 1).toString().padStart(2, "0");
  const date = dt.getDate().toString().padStart(2, "0");
  const formatted = `${year}.${month}.${date}`.replace(/\n|\r/g, "");
  return formatted;
}