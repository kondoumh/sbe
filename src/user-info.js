window.onload = () => {
  let projectName = sessionStorage.getItem("projectName");
  let userName = sessionStorage.getItem("userName");
  let userDisplayName = sessionStorage.getItem("userDisplayName");
  if (!projectName || !username || !userDisplayName) {
    projectName = localStorage.getItem("projectName")
    sessionStorage.setItem("projectName", projectName)
    localStorage.removeItem("projectName");
    userName = localStorage.getItem("userName");
    sessionStorage.setItem("userName", userName);
    localStorage.removeItem("userName");
    userDisplayName = localStorage.getItem("userDisplayName");
    sessionStorage.setItem("userDisplayName", userDisplayName);
    localStorage.removeItem("userDisplayName");
  }
  showUserInfo(projectName, userName, userDisplayName);
};

async function showUserInfo(projectName, userName, userDisplayName) {
  const contentUser = document.querySelector("#user-info");

  const infoKey = projectName + "_" + userName;

  let userInfo = {};
  const localData = localStorage.getItem(infoKey);
  if (localData) {
    userInfo = JSON.parse(localData);
  }
  contentUser.innerHTML = userName + " (" + userDisplayName + ")" +  "<br>";
  if (userInfo.pages) {
    contentUser.innerHTML += "pages created: " + userInfo.pages.length + "<br>";
  }
  document.querySelector("#fetched").innerHTML = "updated: " + userInfo.fetched;

  if (!userInfo.pages) return;

  const contentPages = document.querySelector("#created-pages");
  let views = 0;
  let linked = 0;
  userInfo.pages.forEach(page => {
    const pageInfo = getDate(page.created) + " : " + getPageLink(projectName, page.title) + "<br>";
    contentPages.innerHTML += pageInfo;
    views += parseInt(page.views);
    linked += parseInt(page.linked);
  });
  contentUser.innerHTML += "views: " + views + "<br>";
  contentUser.innerHTML += "linkded: " + linked;
}

function getPageLink(projectName, title) {
  return `<a href="https://scrapbox.io/${projectName}/${title}" target="_blank">${title}</a>`;
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
