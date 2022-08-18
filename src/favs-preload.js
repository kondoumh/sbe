const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'favsApi', {
    getFavs: async () => {
      const favs = await ipcRenderer.invoke('get-favs');
      return favs;
    },
    deleteFav: async fav => {
      const favs = await ipcRenderer.invoke('delete-fav', fav);
      return favs;
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
