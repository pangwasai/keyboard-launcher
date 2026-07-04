import { shell, clipboard } from 'electron'
import { execFile, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export function launchTarget(mapping) {
  if (!mapping || !mapping.type) {
    console.error('[Launcher] Invalid mapping:', mapping)
    return { success: false, error: 'Invalid mapping' }
  }
  if (mapping.type !== 'text' && !mapping.target) {
    console.error('[Launcher] Invalid mapping: missing target')
    return { success: false, error: 'Invalid mapping' }
  }
  console.log('[Launcher] Launching:', mapping.type, mapping.target)
  try {
    switch (mapping.type) {
      case 'url': return launchUrl(mapping.target)
      case 'folder': return launchFolder(mapping.target)
      case 'app': return launchApp(mapping.target)
      case 'file': return launchFile(mapping.target)
      case 'text': return typeText(mapping.target)
      default: return { success: false, error: 'Unknown mapping type' }
    }
  } catch (err) {
    console.error('Launch failed:', err)
    return { success: false, error: err.message }
  }
}

function launchUrl(url) {
  try {
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) { finalUrl = 'https://' + finalUrl }
    shell.openExternal(finalUrl)
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}

function launchFolder(folderPath) {
  try {
    shell.openPath(folderPath)
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}

function launchApp(appPath) {
  try {
    appPath = appPath.trim()
    if (!fs.existsSync(appPath)) { return { success: false, error: '文件不存在: ' + appPath } }
    if (appPath.toLowerCase().endsWith('.lnk')) { shell.openPath(appPath); return { success: true } }
    const child = spawn('cmd.exe', ['/c', 'start', '""', appPath], { detached: true, stdio: 'ignore' })
    child.unref()
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}

function launchFile(filePath) {
  try {
    filePath = filePath.trim()
    if (!fs.existsSync(filePath)) { return { success: false, error: '文件不存在: ' + filePath } }
    shell.openPath(filePath)
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}

function typeText(text) {
  try {
    if (!text) { return { success: false, error: '文本内容为空' } }
    clipboard.writeText(text)
    setTimeout(() => {
      const psScript = '(New-Object -ComObject WScript.Shell).SendKeys("^v")'
      const child = spawn('powershell.exe', ['-WindowStyle', 'Hidden', '-Command', psScript], { detached: true, stdio: 'ignore' })
      child.unref()
    }, 600)
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}
