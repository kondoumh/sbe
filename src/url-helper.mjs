const sbUrl = {}

sbUrl.BASE_URL = 'https://scrapbox.io/';
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
  if (path.length < 2) {
    return false;
  }
  if (['projects', 'files', 'settings', 'stream', 'api'].includes(path[0])) {
    return false;
  }
  return (path.length >= 2 && path[1] !== '');
}

sbUrl.isProjectTop = url => {
  if(!url.startsWith(sbUrl.BASE_URL)) {
    return false;
  };
  const path = url.substring(sbUrl.BASE_URL.length).split(/\/|#/);
  if (path.length < 1) {
    return false;
  }
  if (['projects', 'files', 'settings', 'stream', 'api'].includes(path[0])) {
    return false;
  }
  return path.length === 1;
};

sbUrl.isScrapboxFile = url => {
  const path = url.substring(sbUrl.BASE_URL.length).split(/\/|#/);
  if (path.length < 2) {
    return false;
  }
  if (path[0] !== 'files') {
    return false;
  }
  return (path[1] !== '');
}

sbUrl.takeProjectPage = url => {
  if (!sbUrl.inScrapbox(url)) {
    return { project: '', page: '' }
  }
  let project, page;
  const path = url.substring(sbUrl.BASE_URL.length).split(/\/|#/);
  project = path[0] ? path[0] : '';
  page = path[1] ? path[1] : '';

  // If the user creates a page titled 'new', it will be'new_'
  if (path[1] === 'new') {
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
  // remove copy action - page?action=copy
  if (page) {
    if (page.endsWith('?action=copy')) {
      const pagepart = page.split(/\?/);
      page = pagepart[0];
    }
  }
  return { project: project, page: page };
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

export default sbUrl;
