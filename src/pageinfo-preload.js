const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'infoApi', {
    fetchPageInfo: async url => {
      const data = await ipcRenderer.invoke('fetch-page-info', url);
      return data;
    },
    openIt: async url => { await ipcRenderer.invoke('open-it', url); },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
