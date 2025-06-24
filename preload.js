const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendToIP: (data) => ipcRenderer.send('send-to-ip', data),
  showGifLocal: (gif) => ipcRenderer.send('show-gif-local', gif),
  onShowGif: (callback) => ipcRenderer.on('show-gif', (event, gif) => callback(gif)),
});
