const { contextBridge, ipcRenderer, clipboard } = require('electron');
const fetch = require('node-fetch');
const sbUrl = require('./url-helper');
const { formatDate } = require('./date-helper');

contextBridge.exposeInMainWorld(
  'api', {
    fetchPostCount: async projectName => {
      const pagesUrl = sbUrl.pagesApi(projectName);
      const sid = await ipcRenderer.invoke('get-cookie');
      const res = await fetch(pagesUrl, { headers: { cookie: sid } }).catch(error => {
        console.log('error..' + error);
        return 0;
      });
      const data = await res.json();
      return parseInt(data.count);
    },
    fetchMetrics: async (projectName, count, skip) => {
      const pagesUrl = sbUrl.pagesApi(projectName);
      const sid = await ipcRenderer.invoke('get-cookie');
      const url = pagesUrl + '?skip=' + (count - 1) + '&limit=' + skip;
      const res = await fetch(url, { headers: { cookie: sid } }).catch(error => {
        console.error('error..' + error);
      });
      let views = 0;
      let linked = 0;
      if (res.status === 200) {
        const data = await res.json();
        Object.keys(data.pages).forEach(key => {
          views += parseInt(data.pages[key].views);
          linked += parseInt(data.pages[key].linked);
        });
        return { views: views, linked: linked, fetched: data.pages.length };
      }
    },
    copyToClipboard: text => {
      clipboard.writeText(text);
    },
    activeProject: async () => {
      const active = await ipcRenderer.invoke('active-project');
      return active;
    },
    getDate: () => {
      return formatDate();
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);

