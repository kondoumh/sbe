const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'api', {
    getHistory: async () => {
      const history = await ipcRenderer.invoke('get-history');
      return history;
    },
    deleteHistory: async item => {
      const history = await ipcRenderer.invoke('delete-history', item);
      return history;
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
