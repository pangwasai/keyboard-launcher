import { globalShortcut } from 'electron'

let currentHotkey = null

export function registerHotkey(accelerator, callback) {
  try {
    if (currentHotkey) { globalShortcut.unregister(currentHotkey) }
    const success = globalShortcut.register(accelerator, callback)
    if (success) { currentHotkey = accelerator; return { success: true, accelerator } }
    else { return { success: false, error: 'Failed to register hotkey' } }
  } catch (err) { return { success: false, error: err.message } }
}

export function unregisterAllHotkeys() {
  globalShortcut.unregisterAll()
  currentHotkey = null
}

export function getCurrentHotkey() { return currentHotkey }
