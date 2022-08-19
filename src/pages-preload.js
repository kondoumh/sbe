const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'pagesApi', {
    fetchPages: async (url) => {
      const data = await ipcRenderer.invoke('fetch-page-info', url);
      return data;
    },
    activeProject: async () => {
      const active = await ipcRenderer.invoke('active-project');
      return active;
    },
    getProjects: async () => {
      const projects = await ipcRenderer.invoke('get-projects');
      return projects;
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
