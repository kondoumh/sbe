const { contextBridge, ipcRenderer } = require('electron');
const fetch = require('node-fetch');

contextBridge.exposeInMainWorld(
  'pagesApi', {
    fetchPages: async (url) => {
      const sid = await ipcRenderer.invoke('get-cookie');
      const res = await fetch(url, { headers: { cookie: sid } }).catch(error => {
        console.error(error);
      });
      let data;
      if (res.status === 200) {
        data = await res.json();
      }
      return data;
    },
    activeProject: async () => {
      const active = await ipcRenderer.invoke('active-project');
      return active;
    },
    openedProjects: async () => {
      const projects = await ipcRenderer.invoke('opened-projects');
      return projects;
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
