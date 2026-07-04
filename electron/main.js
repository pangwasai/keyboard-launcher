import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, shell, screen, dialog, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { registerHotkey, unregisterAllHotkeys } from './hotkey'
import { getConfig, saveConfig, updateMapping, deleteMapping } from './storage'
import { launchTarget } from './launcher'
import { initScreenshot } from './screenshot'

let mainWindow = null
let tray = null

const isPackaged = app.isPackaged
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = isPackaged ? path.join(__dirname, '..') : path.join(__dirname, '..')
const rendererDistPath = isPackaged ? path.join(appRoot, 'dist') : path.join(appRoot, 'dist')
const preloadPath = isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, 'preload.js')

process.env.APP_ROOT = appRoot
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(appRoot, 'public')
  : rendererDistPath

function createTrayIcon() {
  const size = 32
  const canvas = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const bg = x >= 2 && x <= size - 3 && y >= 2 && y <= size - 3 &&
        !(x <= 3 && y <= 3) && !(x >= size - 4 && y <= 3) &&
        !(x <= 3 && y >= size - 4) && !(x >= size - 4 && y >= size - 4)
      if (bg) {
        canvas[i] = 20; canvas[i + 1] = 22; canvas[i + 2] = 28; canvas[i + 3] = 255
        if (y >= 6 && y <= 11) {
          for (let k = 0; k < 5; k++) {
            const kx = 3 + k * 6
            if (x >= kx && x <= kx + 3) { canvas[i] = 70; canvas[i + 1] = 150; canvas[i + 2] = 255 }
          }
        }
        if (y >= 14 && y <= 19) {
          for (let k = 0; k < 4; k++) {
            const kx = 5 + k * 6
            if (x >= kx && x <= kx + 3) { canvas[i] = 70; canvas[i + 1] = 150; canvas[i + 2] = 255 }
          }
        }
        if (y >= 22 && y <= 27) {
          if (x >= 5 && x <= 26) { canvas[i] = 90; canvas[i + 1] = 170; canvas[i + 2] = 255 }
        }
      } else {
        canvas[i] = 0; canvas[i + 1] = 0; canvas[i + 2] = 0; canvas[i + 3] = 0
      }
    }
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function createWindow() {
  const config = getConfig()
  const primaryDisplay = screen.getPrimaryDisplay()
  const { bounds: screenBounds } = primaryDisplay
  const layoutRows = [10, 10, 9, 8]
  const keySize = config.keySize || 68
  const gap = config.keyGap || 10
  let maxRowWidth = 0
  for (const count of layoutRows) {
    const rowWidth = count * keySize + (count - 1) * gap
    if (rowWidth > maxRowWidth) maxRowWidth = rowWidth
  }
  const windowWidth = Math.max(300, Math.floor(maxRowWidth + 40))
  const windowHeight = Math.floor(layoutRows.length * keySize + (layoutRows.length - 1) * gap + 80)
  const x = Math.floor(screenBounds.x + (screenBounds.width - windowWidth) / 2)
  const y = Math.floor(screenBounds.y + (screenBounds.height - windowHeight) / 2)

  mainWindow = new BrowserWindow({
    x, y, width: windowWidth, height: windowHeight,
    frame: false, transparent: true, resizable: false, alwaysOnTop: true, skipTaskbar: true, show: false,
    webPreferences: { preload: preloadPath, nodeIntegration: false, contextIsolation: true, webSecurity: false }
  })
  mainWindow.setIgnoreMouseEvents(false)
  if (VITE_DEV_SERVER_URL) { mainWindow.loadURL(VITE_DEV_SERVER_URL) }
  else { mainWindow.loadFile(path.join(rendererDistPath, 'index.html')) }
  mainWindow.webContents.on('console-message', (event, level, message) => { console.log('[RENDERER] ' + message) })
  let isConfigOpen = false
  mainWindow.on('blur', () => { if (mainWindow && !mainWindow.isDestroyed() && !isConfigOpen) { mainWindow.hide() } })
  ipcMain.handle('config:open', () => { isConfigOpen = true; return { success: true } })
  ipcMain.handle('config:close', () => { isConfigOpen = false; return { success: true } })
  mainWindow.on('closed', () => { mainWindow = null })
}

function toggleWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) { mainWindow.hide() }
  else { mainWindow.show(); mainWindow.focus() }
}

function createTray() {
  try {
    const icon = createTrayIcon()
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
      { label: '显示/隐藏', click: toggleWindow },
      { type: 'separator' },
      { label: '退出', click: () => { app.quit() } }
    ])
    tray.setToolTip('Keyboard Launcher')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', toggleWindow)
  } catch (err) { console.error('Failed to create tray:', err) }
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  const config = getConfig()
  registerHotkey(config.hotkey || 'Ctrl+Shift+Space', toggleWindow)
  ipcMain.handle('config:get', () => getConfig())
  ipcMain.handle('config:save', (_, config) => saveConfig(config))
  ipcMain.handle('mapping:update', (_, keyCode, mapping) => updateMapping(keyCode, mapping))
  ipcMain.handle('mapping:delete', (_, keyCode) => deleteMapping(keyCode))
  ipcMain.handle('launch', (_, mapping) => { return launchTarget(mapping) })
  ipcMain.handle('window:hide', () => mainWindow && mainWindow.hide())
  ipcMain.handle('hotkey:update', (_, hotkey) => { unregisterAllHotkeys(); return registerHotkey(hotkey, toggleWindow) })
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Executables', extensions: ['exe', 'lnk'] }, { name: 'All Files', extensions: ['*'] }] })
    return result.canceled ? null : result.filePaths[0]
  })
  ipcMain.handle('dialog:openDocument', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Documents', extensions: ['docx', 'pdf', 'xlsx', 'xls', 'doc', 'pptx', 'ppt', 'txt', 'md', 'csv'] }, { name: 'All Files', extensions: ['*'] }] })
    return result.canceled ? null : result.filePaths[0]
  })
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })
  ipcMain.handle('shell:openExternal', (_, url) => shell.openExternal(url))
  initScreenshot(mainWindow)
  ipcMain.handle('window:updateOpacity', (_, opacity) => { return { success: true } })
  ipcMain.handle('window:updateBgOpacity', (_, bgOpacity) => {
    if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.webContents.send('bg-opacity:update', bgOpacity) }
    return { success: true }
  })
  ipcMain.handle('dialog:openImage', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }, { name: 'All Files', extensions: ['*'] }] })
    return result.canceled ? null : result.filePaths[0]
  })
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow() } })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') { app.quit() } })
app.on('will-quit', () => { unregisterAllHotkeys() })