let openUrl
let modalPageInfo;
let modalProjectInfo;
let modalLinks;

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

function createLiksDialog(url1, url2) {
  const webview = document.querySelector("#link-webview");
  if (!modalLinks) {
    modalLinks = document.querySelector("#hop1-links");
    document.querySelector("#link-prev").addEventListener("click", () => {
      console.log("prev");
      webview.src = url1
    });
    document.querySelector("#link-next").addEventListener("click", () => {
      console.log("next");
      webview.src = url2
    });
  }
  webview.src = url1;
  return modalLinks;
}

module.exports = {
  createPageDialog,
  createProjectDialog,
  createLiksDialog
};