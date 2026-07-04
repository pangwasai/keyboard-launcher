import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  updateMapping: (keyCode, mapping) => ipcRenderer.invoke('mapping:update', keyCode, mapping),
  deleteMapping: (keyCode) => ipcRenderer.invoke('mapping:delete', keyCode),
  launch: (mapping) => ipcRenderer.invoke('launch', mapping),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  updateHotkey: (hotkey) => ipcRenderer.invoke('hotkey:update', hotkey),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openDocumentDialog: () => ipcRenderer.invoke('dialog:openDocument'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  startScreenshot: () => ipcRenderer.invoke('screenshot:start'),
  screenshotSelect: (rect) => ipcRenderer.send('screenshot:select', rect),
  screenshotCancel: () => ipcRenderer.send('screenshot:cancel'),
  updateOpacity: (opacity) => ipcRenderer.invoke('window:updateOpacity', opacity),
  updateBgOpacity: (bgOpacity) => ipcRenderer.invoke('window:updateBgOpacity', bgOpacity),
  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),
  configOpen: () => ipcRenderer.invoke('config:open'),
  configClose: () => ipcRenderer.invoke('config:close'),
  onBgOpacityUpdate: (callback) => { ipcRenderer.on('bg-opacity:update', (_, value) => callback(value)) }
})
