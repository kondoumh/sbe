let openUrl
let modalPageInfo;
let modalProjectInfo;
let modalLinks;
let urlIdx = 0;
let linkUrls;

function createPageDialog(data) {
  openUrl = data.url;
  if (!modalPageInfo) {
    modalPageInfo = document.querySelector("#page-info");
    modalPageInfo.addEventListener("click", (event) => {
      if (event.target === modalPageInfo) {
        modalPageInfo.close("cancelled");
      }
    });
    document.querySelector("#open-it").addEventListener("click", () => {
      modalPageInfo.close();
      addTab(openUrl);
    });
  }
  let content = document.querySelector("#dialog-contents");
  content.innerHTML = data.content;
  document.querySelector("#contents-image").src = "";
  if (data.image) {
    document.querySelector("#contents-image").src = data.image;
  }
  return modalPageInfo;
}

function createProjectDialog(data) {
  if (!modalProjectInfo) {
    modalProjectInfo = document.querySelector("#project-info");
    modalProjectInfo.addEventListener("click", (event) => {
      if (event.target === modalProjectInfo) {
        modalProjectInfo.close("cancelled");
      }
    });
    document.querySelector("#copy-content").addEventListener("click", () => {
      const content = document.querySelector("#project-dialog-contents");
      clipboard.writeText(content.innerHTML.replace(/<br>/g, "\n"));
    });
  }
  const content = document.querySelector("#project-dialog-contents");
  content.innerHTML = `Project: ${data.projectName}<br>`
  content.innerHTML += `${data.date}<br>`
  content.innerHTML += `Pages ${data.totalCount} : Views ${data.views} : Linked ${data.linked}`;
  return modalProjectInfo;
}

function createLiksDialog(urls) {
  urlIdx = 0;
  linkUrls = urls;
  const webview = document.querySelector("#link-webview");
  if (!modalLinks) {
    modalLinks = document.querySelector("#hop1-links");
    document.querySelector("#link-prev").addEventListener("click", () => {
      console.log("prev");
      if (urlIdx > 0) {
        urlIdx--;
        webview.src = linkUrls[urlIdx];
      }
    });
    document.querySelector("#link-next").addEventListener("click", () => {
      console.log("next");
      if (urlIdx < linkUrls.length) {
        urlIdx++;
        webview.src = linkUrls[urlIdx];
      }
    });
  }
  webview.src = linkUrls[urlIdx];
  return modalLinks;
}

module.exports = {
  createPageDialog,
  createProjectDialog,
  createLiksDialog
};