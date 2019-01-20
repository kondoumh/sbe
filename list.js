const BASE_URL = "https://scrapbox.io/";

function getPageTitles(direction) {
  const titles = document.getElementById("titles");
  const status = document.getElementById("sbe_paging");
  const projectName = localStorage.getItem("projectName");
  const skip = sessionStorage.getItem("skip");
  const start = skip ? parseInt(skip) : 1;
  const pagesUrl = BASE_URL + "api/pages/" + projectName + "?skip=" + (start - 1) + "&limit=100";
  fetch(pagesUrl, {
    credentials: "include"
  })
    .then(res => {
      if (res.status === 200) {
        res.json().then(data => {
          const limit = parseInt(data.limit);
          const end = start + limit - 1;
          const total = parseInt(data.count);
          status.innerHTML = start + " - " + end + " total:" + total + "<br>";
          titles.innerHTML = direction + "<br>";
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
          if (start + limit < total) {
            sessionStorage.setItem("skip", start + limit);
          }
        });
      } else {
        titles.innerHTML = "ng - " + projectName;
      }
    })
    .catch(error => {
      titles.innerHTML = error;
    });
}
