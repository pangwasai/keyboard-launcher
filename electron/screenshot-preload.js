import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('screenshotAPI', {
  select: (rect) => ipcRenderer.send('screenshot:select', rect),
  cancel: () => ipcRenderer.send('screenshot:cancel'),
  updateSelection: (rect) => ipcRenderer.send('screenshot:updateSelection', rect)
})
