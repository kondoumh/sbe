const BASE_URL = "https://scrapbox.io/";
const LIMIT = 100;

function getPageTitles(direction) {
  const table = document.querySelector("#sbe_pages");
  const status = document.querySelector("#sbe_paging");
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
  table.innerHTML = "";
  let header = table.createTHead();
  let hrow = header.insertRow(-1);
  let hcell1 = hrow.insertCell(0);
  let hcell2 = hrow.insertCell(1);
  let hcell3 = hrow.insertCell(2);
  let hcell4 = hrow.insertCell(3);
  let hcell5 = hrow.insertCell(4);
  hcell1.innerHTML = "pin"
  hcell2.innerHTML = "views";
  hcell3.innerHTML = "linked";
  hcell4.innerHTML = "img";
  hcell5.innerHTML = "Title";
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
            let row = table.insertRow(-1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let cell4 = row.insertCell(3);
            let cell5 = row.insertCell(4);
            cell1.innerHTML = data.pages[key].pin !== 0 ? "&#x2714;" : "";
            cell2.innerHTML = data.pages[key].views;
            cell3.innerHTML = data.pages[key].linked;
            cell4.innerHTML = data.pages[key].image !== null ? "<img src=" + data.pages[key].image + " width='25' height='25'>" : "";
            cell5.innerHTML = "<a href=" + BASE_URL + projectName + "/" + encodeURI(data.pages[key].title) + ">" + data.pages[key].title + "</a>";
          });
        });
      } else {
        status.innerHTML = "ng - " + projectName;
      }
    })
    .catch(error => {
      status.innerHTML = error;
    });
}
