const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onStats: (callback) => ipcRenderer.on('stats', (event, data) => callback(data)),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized')
});
