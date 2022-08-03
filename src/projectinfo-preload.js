const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld(
  'api', {
    fetchPostCount: async projectName => {
      const count = await ipcRenderer.invoke('fetch-post-count', projectName);
      return count;
    },
    fetchMetrics: async (projectName, count, skip) => {
      const metrics = await ipcRenderer.invoke('fetch-project-metrics', projectName, count, skip);
      return metrics;
    },
    copyToClipboard: text => {
      clipboard.writeText(text);
    },
    activeProject: async () => {
      const active = await ipcRenderer.invoke('active-project');
      return active;
    },
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
  }
);

