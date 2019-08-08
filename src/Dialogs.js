const { fetchPageText } = require("./MetaData");

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

function createLinksDialog(urls, pageUrls) {
  urlIdx = 0;
  linkUrls = urls;
  const contents = document.querySelector("#link-contents");
  if (!modalLinks) {
    modalLinks = document.querySelector("#hop1-links");
    modalLinks.addEventListener("click", (event) => {
      if (event.target === modalLinks) {
        modalLinks.close("cancelled");
      }
    });
    document.querySelector("#link-begin").addEventListener("click", () => {
      urlIdx = 0;
      fetchContent(linkUrls[urlIdx], contents);
      setLinkPaging(urlIdx, linkUrls.length);
    });
    document.querySelector("#link-prev").addEventListener("click", () => {
      if (urlIdx > 0) {
        urlIdx--;
        fetchContent(linkUrls[urlIdx], contents);
        setLinkPaging(urlIdx, linkUrls.length);
      }
    });
    document.querySelector("#link-next").addEventListener("click", () => {
      if (urlIdx < linkUrls.length - 1) {
        urlIdx++;
        fetchContent(linkUrls[urlIdx], contents);
        setLinkPaging(urlIdx, linkUrls.length);
      }
    });
    document.querySelector("#link-end").addEventListener("click", () => {
      urlIdx = linkUrls.length - 1;
      fetchContent(linkUrls[urlIdx], contents);
      setLinkPaging(urlIdx, linkUrls.length);
    });
    document.querySelector("#open-link").addEventListener("click", () => {
      modalLinks.close();
      addTab(pageUrls[urlIdx]);
    });
  }
  fetchContent(linkUrls[urlIdx], contents);
  setLinkPaging(urlIdx, linkUrls.length);
  return modalLinks;
}

async function fetchContent(url, contents) {
  const { title, author, content } = await fetchPageText(url);
  contents.innerHTML = title + " : " + author + "<br><hr>";
  contents.innerHTML += content;
}

function setLinkPaging(idx, length) {
  document.querySelector("#link-paging").innerHTML = `${idx + 1} / ${length}`;
}

module.exports = {
  createPageDialog,
  createProjectDialog,
  createLinksDialog
};