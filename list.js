const BASE_URL = "https://scrapbox.io/";

function getPageTitles() {
  const titles = document.getElementById("titles");
  const status = document.getElementById("sbe_paging");
  const projectName = localStorage.getItem("projectName");
  const pagesUrl = BASE_URL + "api/pages/" + projectName; // path[0];
  fetch(pagesUrl, {
    credentials: "include"
  })
    .then(res => {
      if (res.status === 200) {    
        res.json().then(data => {
          status.innerHTML = data.skip + " - " + data.limit + " total:" + data.count + "<br>";
          Object.keys(data.pages).forEach(key => {
            titles.innerHTML += "<a href=" + BASE_URL + projectName + "/" + encodeURI(data.pages[key].title) + ">"+ data.pages[key].title + "</a><br>";
          })
        });
      } else {
          titles.innerHTML = "ng - " + projectName;
      }
    })
    .catch(error => {
        titles.innerHTML = error;
    });
}
