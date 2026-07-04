import { BrowserWindow, ipcMain, desktopCapturer, screen, globalShortcut } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let screenshotWindow = null
let screenshotCallback = null
let mainWindowRef = null
let selectionRect = null

export function initScreenshot(mainWindow) {
  mainWindowRef = mainWindow
  ipcMain.handle('screenshot:start', async () => { return new Promise((resolve) => { screenshotCallback = resolve; selectionRect = null; createScreenshotWindow() }) })
  ipcMain.on('screenshot:select', async (_, rect) => { selectionRect = rect; await handleScreenshotSelect(rect) })
  ipcMain.on('screenshot:updateSelection', (_, rect) => { selectionRect = rect })
  ipcMain.on('screenshot:cancel', () => { handleScreenshotCancel() })
  ipcMain.on('screenshot:confirm', () => { if (selectionRect) { handleScreenshotSelect(selectionRect) } })
}

async function handleScreenshotSelect(rect) {
  cleanupScreenshotShortcuts()
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { scaleFactor } = primaryDisplay
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: primaryDisplay.size.width * scaleFactor, height: primaryDisplay.size.height * scaleFactor } })
    if (sources.length > 0 && screenshotCallback) {
      const image = sources[0].thumbnail
      const scaledRect = { x: Math.round(rect.x * scaleFactor), y: Math.round(rect.y * scaleFactor), width: Math.max(1, Math.round(rect.width * scaleFactor)), height: Math.max(1, Math.round(rect.height * scaleFactor)) }
      screenshotCallback({ success: true, imageData: image.crop(scaledRect).resize({ width: 128, height: 128 }).toDataURL() })
      screenshotCallback = null
    } else if (screenshotCallback) { screenshotCallback({ success: false, error: 'No screen found' }); screenshotCallback = null }
  } catch (err) {
    if (screenshotCallback) { screenshotCallback({ success: false, error: err.message }); screenshotCallback = null }
  }
  closeScreenshotWindow()
  restoreMainWindow()
}

function handleScreenshotCancel() {
  cleanupScreenshotShortcuts()
  if (screenshotCallback) { screenshotCallback({ success: false, error: 'Cancelled' }); screenshotCallback = null }
  closeScreenshotWindow()
  restoreMainWindow()
}

function cleanupScreenshotShortcuts() { try { globalShortcut.unregister('Escape'); globalShortcut.unregister('Enter') } catch (e) {} }
function restoreMainWindow() { if (mainWindowRef && !mainWindowRef.isDestroyed()) { mainWindowRef.show(); mainWindowRef.focus() } }

function createScreenshotWindow() {
  if (screenshotWindow) { screenshotWindow.focus(); return }
  if (mainWindowRef && !mainWindowRef.isDestroyed()) { mainWindowRef.hide() }
  const primaryDisplay = screen.getPrimaryDisplay()
  const { bounds } = primaryDisplay
  screenshotWindow = new BrowserWindow({
    x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
    frame: false, transparent: true, resizable: false, movable: false, minimizable: true, maximizable: false, closable: true, alwaysOnTop: true, skipTaskbar: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'screenshot-preload.js'), nodeIntegration: false, contextIsolation: true, webSecurity: false }
  })
  screenshotWindow.setIgnoreMouseEvents(false)
  screenshotWindow.setAlwaysOnTop(true, 'screen-saver')
  screenshotWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getScreenshotHTML()))
  screenshotWindow.once('ready-to-show', () => {
    screenshotWindow.show(); screenshotWindow.focus(); screenshotWindow.webContents.focus()
    try { globalShortcut.register('Escape', () => { handleScreenshotCancel() }) } catch (e) {}
    try { globalShortcut.register('Enter', () => { if (selectionRect) { handleScreenshotSelect(selectionRect) } }) } catch (e) {}
  })
  screenshotWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'Escape') { event.preventDefault(); handleScreenshotCancel() }
      else if (input.key === 'Enter' || input.key === 'Return') { event.preventDefault(); if (selectionRect) { handleScreenshotSelect(selectionRect) } }
    }
  })
  screenshotWindow.on('closed', () => {
    cleanupScreenshotShortcuts(); screenshotWindow = null; selectionRect = null
    if (screenshotCallback) { screenshotCallback({ success: false, error: 'Window closed' }); screenshotCallback = null }
    restoreMainWindow()
  })
}

function closeScreenshotWindow() {
  if (screenshotWindow && !screenshotWindow.isDestroyed()) { screenshotWindow.close(); screenshotWindow = null; selectionRect = null }
}

function getScreenshotHTML() {
  return '<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden}body{background:rgba(0,0,0,0.4);cursor:crosshair;user-select:none;-webkit-user-select:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.selection{border:2px solid #0a84ff;background:rgba(10,132,255,0.2);position:absolute;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);display:none;pointer-events:none}.selection.show{display:block}.toolbar{position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(30,30,35,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px 16px;display:none;gap:10px;z-index:100;align-items:center}.toolbar.show{display:flex}.toolbar .size-info{color:rgba(255,255,255,0.8);font-size:13px;padding:0 8px}.toolbar button{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:500}.btn-confirm{background:#0a84ff;color:#fff}.btn-confirm:hover{background:#2b96ff}.btn-cancel{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.1)}.btn-cancel:hover{background:rgba(255,255,255,0.15);color:#fff}.close-btn{position:fixed;top:20px;right:20px;width:36px;height:36px;border-radius:50%;background:rgba(255,80,80,0.9);color:#fff;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:200}.close-btn:hover{background:rgba(255,100,100,1);transform:scale(1.1)}.hint{position:fixed;top:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.7);font-size:13px;background:rgba(0,0,0,0.5);padding:8px 16px;border-radius:8px;z-index:100;pointer-events:none}</style></head><body><button class="close-btn" id="closeBtn">x</button><div class="hint">拖拽鼠标选择区域，按 Enter 确认，按 ESC 取消</div><div class="selection" id="selection"></div><div class="toolbar" id="toolbar"><span class="size-info" id="sizeInfo">0 x 0</span><button class="btn-cancel" id="cancelBtn">取消 (ESC)</button><button class="btn-confirm" id="confirmBtn">确认截图 (Enter)</button></div><script>var s=document.getElementById("selection"),t=document.getElementById("toolbar"),i=document.getElementById("sizeInfo"),c=document.getElementById("cancelBtn"),n=document.getElementById("confirmBtn"),e=document.getElementById("closeBtn"),o=0,a=0,r=!1,l=null;function u(e,t){i.textContent=Math.round(e)+" x "+Math.round(t)}e.addEventListener("click",function(){window.screenshotAPI&&window.screenshotAPI.cancel()}),c.addEventListener("click",function(){window.screenshotAPI&&window.screenshotAPI.cancel()}),n.addEventListener("click",function(){l&&window.screenshotAPI&&window.screenshotAPI.select(l)}),document.addEventListener("mousedown",function(e){e.target.closest(".toolbar")||e.target.closest(".close-btn")||(r=!0,o=e.clientX,a=e.clientY,s.style.left=o+"px",s.style.top=a+"px",s.style.width="0px",s.style.height="0px",s.classList.add("show"),t.classList.remove("show"))}),document.addEventListener("mousemove",function(e){if(r){var t=Math.min(o,e.clientX),i=Math.min(a,e.clientY),c=Math.abs(e.clientX-o),n=Math.abs(e.clientY-a);s.style.left=t+"px",s.style.top=i+"px",s.style.width=c+"px",s.style.height=n+"px",u(c,n)}}),document.addEventListener("mouseup",function(e){if(r){r=!1;if(e.target.closest(".toolbar")||e.target.closest(".close-btn"))return;var i=Math.min(o,e.clientX),c=Math.min(a,e.clientY),n=Math.abs(e.clientX-o),d=Math.abs(e.clientY-a);n>10&&d>10?(l={x:i,y:c,width:n,height:d},u(n,d),t.classList.add("show"),window.screenshotAPI&&window.screenshotAPI.updateSelection(l)):(s.classList.remove("show"),t.classList.remove("show"),l=null)}}),document.addEventListener("keydown",function(e){"Escape"===e.key?(e.preventDefault(),e.stopPropagation(),window.screenshotAPI&&window.screenshotAPI.cancel()):"Enter"===e.key&&l&&(e.preventDefault(),e.stopPropagation(),window.screenshotAPI&&window.screenshotAPI.select(l))}),window.addEventListener("blur",function(){setTimeout(function(){window.screenshotAPI&&window.screenshotAPI.cancel()},100)});</script></body></html>'
}
