const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    topChange: () => ipcRenderer.send('topChange')
})

window.addEventListener('DOMContentLoaded', () => {

})