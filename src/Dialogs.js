const { fetchPageText, renderLines } = require("./MetaData");
const Store = require("electron-store");
const sbUrl = require("./UrlHelper");

let openUrl
let modalPageInfo;
let modalProjectInfo;
let modalLinks;
let modalPersonal;
let urlIdx = 0;
let linkUrls;
let pageUrls;
const cache = new Map();

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
    document.querySelector("#open-detail").addEventListener("click", () => {
      modalPageInfo.close();
      const path = tabGroup.getPath(openUrl);
      const urlDetail = sbUrl.getPageUrl(path[0], path[1]);
      createPageDetailDialog(urlDetail, openUrl).showModal();
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

function createPageDetailDialog(apiUrl, url) {
  const contents = document.querySelector("#page-contents");
  const titleHeader = document.querySelector("#page-header");
  const pageDetail = document.querySelector("#page-detail");
  pageDetail.addEventListener("click", (event) => {
    if (event.target === pageDetail) {
      pageDetail.close("cancelled");
    }
  });
  document.querySelector("#open-page").addEventListener("click", () => {
    pageDetail.close();
    addTab(url);
  });

  const container = document.querySelector("#page-contents-container");
  adjustSize(container);

  renderDetail(titleHeader, contents, apiUrl);
  return pageDetail;
}

function adjustSize(container) {
  const store = new Store();
  let {width, height} = store.get("bounds");
  width = width ? Math.ceil(width * 0.7) : 400;
  height = height ? Math.ceil(height * 0.6) : 300;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
}

async function renderDetail(titleHeader, contents, url) {
  let page = {};
  const { title, author, content, collaborators } = await fetchPageText(url);
  page.title = title;
  page.author = author;
  page.content = page.author;
  page.content += collaborators;
  page.content += "<hr>"
  page.content += content;

  titleHeader.innerHTML = page.title;
  contents.innerHTML = page.content;
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
  cache.clear();
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
      updateContent(titleHeader, contents, urlIdx, linkUrls.length);
    });
    document.querySelector("#link-prev").addEventListener("click", () => {
      if (urlIdx > 0) {
        urlIdx--;
        updateContent(titleHeader, contents, urlIdx, linkUrls.length);
      }
    });
    document.querySelector("#link-next").addEventListener("click", () => {
      if (urlIdx < linkUrls.length - 1) {
        urlIdx++;
        updateContent(titleHeader, contents, urlIdx, linkUrls.length);
      }
    });
    document.querySelector("#link-end").addEventListener("click", () => {
      urlIdx = linkUrls.length - 1;
      updateContent(titleHeader, contents, urlIdx, linkUrls.length);
    });
    document.querySelector("#open-link").addEventListener("click", () => {
      addTab(pageUrls[urlIdx], true, "", false);
    });
  }
  const container = document.querySelector("#link-contents-container");
  adjustSize(container);

  updateContent(titleHeader, contents, urlIdx, linkUrls.length);
  return modalLinks;
}

function updateContent(titleHeader, contents, urlIdx, totalCount) {
  contents.innerHTML = descriptions[urlIdx];
  fetchContent(linkUrls[urlIdx], titleHeader, contents);
  setLinkPaging(urlIdx, totalCount);
}

async function fetchContent(url, titleHeader, contents) {
  disablePagingButtons(true);
  let page = {};
  if (!cache.has(url)) {
    const { title, author, content } = await fetchPageText(url);
    cache.set(url, {title, author, content});
    page.title = title;
    page.author = author;
    page.content = content;
  } else {
    const { title, author, content } = cache.get(url);
    page.title = title;
    page.author = author;
    page.content = content;
  }
  titleHeader.innerHTML = page.title + " : " + page.author;
  contents.innerHTML = page.content;
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

function createPersonalDialog(data) {
  if (!modalPersonal) {
    modalPersonal = document.querySelector("#personal-info");
    modalPersonal.addEventListener("click", (event) => {
      if (event.target === modalPersonal) {
        modalPersonal.close("cancelled");
      }
    });
    document.querySelector("#close-personal").addEventListener("click", () => {
      modalPersonal.close();
    });
  }
  let content = document.querySelector("#personal-contents");
  content.innerHTML = data;
  return modalPersonal;
}

module.exports = {
  createPageDialog,
  createProjectDialog,
  createLinksDialog,
  createPersonalDialog
};
