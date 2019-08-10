const { fetchPageText, renderLines } = require("./MetaData");
const Store = require("electron-store");
const sbUrl = require("./UrlHelper");

let openUrl
let modalPageInfo;
let modalProjectInfo;
let modalLinks;
let urlIdx = 0;
let linkUrls;
let pageUrls;

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

function createLinksDialog(data, path) {
  urlIdx = 0;
  linkUrls = data.relatedPages.links1hop.map(link => {
    return sbUrl.getPageUrl(path[0], link.titleLc.replace(/\//g, "%2F"));
  });
  pageUrls = data.relatedPages.links1hop.map(link => {
    return sbUrl.BASE_URL + path[0] + "/" + link.titleLc.replace(/\//g, "%2F");
  });
  descriptions = data.relatedPages.links1hop.map(link => {
    return renderLines(link.descriptions) + "<h3>取得中・・・・</h3>";
  });

  const contents = document.querySelector("#link-contents");
  const titleHeader = document.querySelector("#links-header");
  if (!modalLinks) {
    modalLinks = document.querySelector("#hop1-links");
    modalLinks.addEventListener("click", (event) => {
      if (event.target === modalLinks) {
        modalLinks.close("cancelled");
      }
    });
    document.querySelector("#link-begin").addEventListener("click", () => {
      urlIdx = 0;
      contents.innerHTML = descriptions[urlIdx];
      fetchContent(linkUrls[urlIdx], titleHeader, contents);
      setLinkPaging(urlIdx, linkUrls.length);
    });
    document.querySelector("#link-prev").addEventListener("click", () => {
      if (urlIdx > 0) {
        urlIdx--;
        contents.innerHTML = descriptions[urlIdx];
        fetchContent(linkUrls[urlIdx], titleHeader, contents);
        setLinkPaging(urlIdx, linkUrls.length);
      }
    });
    document.querySelector("#link-next").addEventListener("click", () => {
      if (urlIdx < linkUrls.length - 1) {
        urlIdx++;
        contents.innerHTML = descriptions[urlIdx];
        fetchContent(linkUrls[urlIdx], titleHeader, contents);
        setLinkPaging(urlIdx, linkUrls.length);
      }
    });
    document.querySelector("#link-end").addEventListener("click", () => {
      urlIdx = linkUrls.length - 1;
      contents.innerHTML = descriptions[urlIdx];
      fetchContent(linkUrls[urlIdx], titleHeader, contents);
      setLinkPaging(urlIdx, linkUrls.length);
    });
    document.querySelector("#open-link").addEventListener("click", () => {
      addTab(pageUrls[urlIdx], true, "", false);
    });
  }
  contents.innerHTML = descriptions[urlIdx];
  const container = document.querySelector("#link-contents-container");
  const store = new Store();
  let {width, height} = store.get("bounds");
  width = width ? Math.ceil(width * 0.7) : 400;
  height = height ? Math.ceil(height * 0.6) : 300;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  fetchContent(linkUrls[urlIdx], titleHeader, contents);
  setLinkPaging(urlIdx, linkUrls.length);
  return modalLinks;
}

async function fetchContent(url, titleHeader, contents) {
  disablePagingButtons(true);
  const { title, author, content } = await fetchPageText(url);
  titleHeader.innerHTML = title + " : " + author;
  contents.innerHTML = content;
  disablePagingButtons(false);
}

function setLinkPaging(idx, length) {
  document.querySelector("#link-paging").innerHTML = `${idx + 1} / ${length}`;
}

function disablePagingButtons(disabled) {
  document.querySelector("#link-begin").disabled = disabled;
  document.querySelector("#link-prev").disabled = disabled;
  document.querySelector("#link-next").disabled = disabled;
  document.querySelector("#link-end").disabled = disabled;
  document.querySelector("#open-link").disabled = disabled;
}

module.exports = {
  createPageDialog,
  createProjectDialog,
  createLinksDialog
};