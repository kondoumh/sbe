const BASE_URL = "https://scrapbox.io/";
const LIMIT = 100;

function getPageTitles(direction) {
  const titles = document.getElementById("titles");
  const status = document.getElementById("sbe_paging");
  const projectName = localStorage.getItem("projectName");
  if (direction === "head") {
      sessionStorage.clear();
  }
  const skip = sessionStorage.getItem("skip");
  let start = skip ? parseInt(skip) : 1;
  const count = sessionStorage.getItem("count");
  const totalCount = count ? parseInt(count) : LIMIT;
  if (direction === "forward") {
      start += LIMIT;
      if (start >= totalCount) return;
  } else if (direction === "backward") {
      start -= LIMIT;
      if (start < 0) {
          start = 0;
      }
  } else if (direction === "tail") {
      start = totalCount - totalCount % LIMIT + 1;
  }
  const pagesUrl = BASE_URL + "api/pages/" + projectName + "?skip=" + (start - 1) + "&limit=" + LIMIT;
  titles.innerHTML = "";
  sessionStorage.setItem("skip", start);
  fetch(pagesUrl, {
    credentials: "include"
  })
    .then(res => {
      if (res.status === 200) {
        res.json().then(data => {
          const end = start + LIMIT - 1;
          const total = parseInt(data.count);
          sessionStorage.setItem("count", total);
          status.innerHTML = start + " - " + end + " total:" + total + "<br>";
          Object.keys(data.pages).forEach(key => {
            titles.innerHTML +=
              "<a href=" +
              BASE_URL +
              projectName +
              "/" +
              encodeURI(data.pages[key].title) +
              ">" +
              data.pages[key].title +
              "</a> / " +
              data.pages[key].views +
              " views  / " +
              data.pages[key].linked +
              " linked<br>";
          });
        });
      } else {
        titles.innerHTML = "ng - " + projectName;
      }
    })
    .catch(error => {
      titles.innerHTML = error;
    });
}
