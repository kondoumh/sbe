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
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
