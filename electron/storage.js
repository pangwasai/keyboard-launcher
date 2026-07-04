import { app } from 'electron'
import fs from 'fs'
import path from 'path'

let configPath = null
let cachedConfig = null

function getConfigPath() {
  if (configPath) return configPath
  const userDataPath = app.getPath('userData')
  configPath = path.join(userDataPath, 'config.json')
  return configPath
}

function getDefaultConfig() {
  return { version: '1.0', hotkey: 'Ctrl+Shift+Space', startOnBoot: false, opacity: 85, bgOpacity: 30, keySize: 68, keyGap: 10, mappings: {} }
}

export function getConfig() {
  if (cachedConfig) return cachedConfig
  const configPath = getConfigPath()
  try {
    if (fs.existsSync(configPath)) { cachedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
    else { cachedConfig = getDefaultConfig(); saveConfig(cachedConfig) }
  } catch (err) {
    console.error('Failed to read config:', err)
    cachedConfig = getDefaultConfig()
  }
  return cachedConfig
}

export function saveConfig(config) {
  const configPath = getConfigPath()
  try {
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }) }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    cachedConfig = config
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}

export function updateMapping(keyCode, mapping) {
  const config = getConfig()
  if (!config.mappings) { config.mappings = {} }
  config.mappings[keyCode] = mapping
  return saveConfig(config)
}

export function deleteMapping(keyCode) {
  const config = getConfig()
  if (config.mappings && config.mappings[keyCode]) { delete config.mappings[keyCode]; return saveConfig(config) }
  return { success: true }
}
