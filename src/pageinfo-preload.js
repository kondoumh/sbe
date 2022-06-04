const { contextBridge, ipcRenderer } = require('electron');
const fetch = require('node-fetch');

contextBridge.exposeInMainWorld(
  'infoApi', {
    fetchPageInfo: async url => {
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
    openIt: async url => { await ipcRenderer.invoke('open-it', url); },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
