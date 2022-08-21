const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'api', {
    getFavs: async () => {
      const favs = await ipcRenderer.invoke('get-favs');
      return favs;
    },
    getHistory: async () => {
      const history = await ipcRenderer.invoke('get-history');
      return history;
    },
    getProjects: async () => {
      const projects = await ipcRenderer.invoke('get-projects');
      return projects;
    },
    getEdited: async () => {
      const edited = await ipcRenderer.invoke('get-edited');
      return edited;
    },
    getUser: async () => {
      const user = await ipcRenderer.invoke('get-user');
      return user;
    },
    openFavsPage: async () => {
      await ipcRenderer.invoke('open-favs-page');
    },
    openHistoryPage: async () => {
      await ipcRenderer.invoke('open-history-page');
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
