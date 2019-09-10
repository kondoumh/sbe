window.onload = () => {
  let projectName = sessionStorage.getItem("projectName")
  if (!projectName) {
    projectName = localStorage.getItem("projectName")
    sessionStorage.setItem("projectName", projectName)
    localStorage.removeItem("projectName")
  }
  document.querySelector("#btn_refresh").addEventListener("click", () => {
    showUserInfo(projectName, true);
  });
  showUserInfo(projectName);
};

async function showUserInfo(projectName, forceRefresh = false) {
  const content = document.querySelector("#user-info");
  content.innerHTML = "Fetching...";

  const user = await fetchUserInfo(getPagesApiUrl(projectName));
  let data = user.name + " (" + user.displayName + ")" + "<br>";

  const infoKey = projectName + "_" + user.name;

  if (forceRefresh) {
    localStorage.removeItem(infoKey);
  }

  let userInfo = {};
  const localData = localStorage.getItem(infoKey);
  let lastCreated;
  if (localData) {
    userInfo = JSON.parse(localData);
    if (userInfo.pages.length > 0) {
      lastCreated = userInfo.pages.reduce((a, b) => a.created > b.created ? a : b);
      console.log(getDate(lastCreated.created) + " : " + lastCreated.title);
    }
  }
  pages = await fetchUserRelatedPages(getPagesApiUrl(projectName), user.userId, content, lastCreated);
  userInfo.fetched = getDate();
  userInfo.pages = pages;
  localStorage.setItem(infoKey, JSON.stringify(userInfo));
  
  data += "pages created: " + userInfo.pages.length + "<hr>";
  document.querySelector("#fetched").innerHTML = "updated: " + userInfo.fetched;

  userInfo.pages.forEach(page => {
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
  const url = `${projectUrl}/?skip=${limit*pagination}&limit=${limit}&sort=created`;
  const res = await fetch(url, { credentials: "include" });
  let data = {}
  if (res.status === 200) {
    data = await res.json();
  }
  return data;
}

async function fetchUserRelatedPages(projectUrl, userId, content, lastCreated) {
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
  if (timestamp) {
    dt.setTime(timestamp * 1000);
  }
  const year = dt.getFullYear();
  const month = (dt.getMonth() + 1).toString().padStart(2, "0");
  const date = dt.getDate().toString().padStart(2, "0");
  const hour = dt.getHours().toString().padStart(2, "0");
  const minute = dt.getMinutes().toString().padStart(2, "0");
  const second = dt.getSeconds().toString().padStart(2, "0");
  const formatted = `${year}.${month}.${date} ${hour}:${minute}:${second}`.replace(/\n|\r/g, "");
  return formatted;
}