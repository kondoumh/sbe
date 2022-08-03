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
    openedProjects: async () => {
      const projects = await ipcRenderer.invoke('opened-projects');
      return projects;
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
