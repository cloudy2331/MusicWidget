const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    topChange: (data) => ipcRenderer.send('topChange', data)
})

// window.addEventListener('DOMContentLoaded', () => {

// })