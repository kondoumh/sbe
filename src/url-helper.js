const sbUrl = {}

sbUrl.BASE_URL = 'https://scrapbox.io/';
sbUrl.LIST_PAGE = 'page-list.html';
sbUrl.USER_PAGE = 'user-info.html';
sbUrl.DEFAULT_ICON_URL = sbUrl.BASE_URL + 'assets/img/favicon/favicon.ico';
sbUrl.GOOGLE_LOGIN_URL = 'https://accounts.google.com'

sbUrl.isUrl = text => {
  return text.match(/^http(s)?:\/\/.+/);
}

sbUrl.inScrapbox = url => {
  return url.startsWith(sbUrl.BASE_URL);
}

sbUrl.isPage = url => {
  if (!url.startsWith(sbUrl.BASE_URL)) {
    return false;
  }
  const path = url.substring(sbUrl.BASE_URL.length).split(/\/|#/);
  return (path.length >= 2 && path[1] !== '');
}

sbUrl.isPageList = url => {
  return !sbUrl.inScrapbox(url) && url.endsWith(sbUrl.LIST_PAGE);
}

sbUrl.isUserPage = url => {
  return !sbUrl.inScrapbox(url) && url.endsWith(sbUrl.USER_PAGE);
}

sbUrl.takeProjectPage = url => {
  let project, page;
  const path = url.substring(sbUrl.BASE_URL.length).split(/\/|#/);
  project = path[0] ? path[0] : '';
  page = path[1] ? path[1] : '';

  // If the user creates a page titled 'new', it will be'new_'
  if (path[1] === 'new') {
    page = '';
  }
  // /product - about scrapbox
  if (path[0] === 'product') {
    project = '';
    page = '';
  }
  // /settings/profile etc
  if (path[0] === 'settings') {
    project = '';
    page = '';
  }
  // /project-name/search/page?q=hoge
  if (path.length > 2 && path[1] === 'search') {
    project = path[0];
    page = '';
  }
  // stream/project-name or projects/project-name/settings
  if (path.length > 1 && (path[0] === 'projects' || path[0] === 'stream')) {
    project = path[1];
    page = '';
  }
  return { project: project, page: page};
}

sbUrl.convertToPageApi = url => {
  const projectPage = sbUrl.takeProjectPage(url);
  return sbUrl.pageApi(projectPage.project, projectPage.page);
}

sbUrl.toTitle = url => {
  const projectPage = sbUrl.takeProjectPage(url);
  if (!projectPage.project) {
    return sbUrl.BASE_URL;
  }
  const title = projectPage.page ? sbUrl.decodeTitle(projectPage.page) : projectPage.project;
  return title;
}

sbUrl.decodeTitle = path => {
  return decodeURIComponent(path).replace(/_/g, ' ');
}

sbUrl.pageApi = (projectName, page) => {
  return sbUrl.BASE_URL + 'api/pages/' + projectName + '/' + page;
}

sbUrl.pagesApi = projectName => {
  return sbUrl.BASE_URL + 'api/pages/' + projectName;
}

sbUrl.getSearchUrl = (projectName, url) => {
  return sbUrl.BASE_URL + projectName + '/search/page?q=' + encodeURIComponent(url);
}

sbUrl.getUserUrl = projectName => {
  return sbUrl.BASE_URL + 'api/pages/' + projectName + '/user';
}

sbUrl.getIconUrl = (projectName, pageTitle) => {
  return sbUrl.BASE_URL + 'api/pages/' + projectName + '/' + pageTitle + '/icon';
}

sbUrl.isLoginLink = (url) => {
  return url.startsWith(sbUrl.BASE_URL + 'login') || url.startsWith(sbUrl.GOOGLE_LOGIN_URL);
}

module.exports = sbUrl;
