const BASE_URL = "https://scrapbox.io/";

function getPageTitles() {
  const target = document.getElementById("output");
  const pagesUrl = BASE_URL + "api/pages/" + "mamezou-knowhow"; // path[0];
  fetch(pagesUrl, {
    credentials: "include",
    mode: "cors"
  })
    .then(res => {
      if (res.status === 200) {
        res.json().then(data => {
          target.innerHTML = JSON.stringify(data.pages);
        });
      } else {
        target.innerHTML = "ng";
      }
    })
    .catch(error => {
      target.innerHTML = error;
    });
}
