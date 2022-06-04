const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'api', {
    goBack: async () => await ipcRenderer.invoke('go-back'),
    goForward: async () => await ipcRenderer.invoke('go-forward'),
    debugView: async () => await ipcRenderer.invoke('debug-view'),
    debugWindow: async () => await ipcRenderer.invoke('debug-window'),
    sendTitle: async (url, title) => await ipcRenderer.invoke('send-title', url, title),
    searchStart: async (text) => await ipcRenderer.invoke('search-start', text),
    searchStop: async () => await ipcRenderer.invoke('search-stop'),
    selectPage: async (contentId) => await ipcRenderer.invoke('select-page', contentId),
    unloadPage: async(contentId) => await ipcRenderer.invoke('unload-page', contentId),
    openPageList: async () => await ipcRenderer.invoke('open-pagelist'),
    openFavsPage: async () => await ipcRenderer.invoke('open-favs-page'),
    openHistoryPage: async () => await ipcRenderer.invoke('open-history-page'),
    sendIdByTitle: async (contentId) => await ipcRenderer.invoke('id-by-title', contentId),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);
