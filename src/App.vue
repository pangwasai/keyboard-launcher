import { ref, computed, watch, onMounted } from 'vue'
import Keyboard from './components/Keyboard.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import SettingsBar from './components/SettingsBar.vue'
import { useConfig } from './composables/useConfig'
import { useKeyboard } from './composables/useKeyboard'
import './styles/keyboard.css'

const keyboardRef = ref(null)
const settingsBarRef = ref(null)
const { mappings, hotkey, opacity, bgOpacity, keySize, keyGap, updateMapping, deleteMapping, getMapping, saveConfig } = useConfig()
const configPanelVisible = ref(false)
const currentKey = ref(null)
const bgOpacityVal = computed(() => { return (bgOpacity.value || 30) / 100 })
const currentMapping = computed(() => { if (!currentKey.value) return null; return getMapping(currentKey.value.code) })

async function launchMapping(mapping) {
  if (!mapping) return
  try {
    if (!window.electronAPI) { console.log('Launch mapping (demo):', mapping); return }
    await window.electronAPI.launch(JSON.parse(JSON.stringify(mapping)))
    window.electronAPI.hideWindow()
  } catch (err) { console.error('Launch failed:', err) }
}

function handleKeyPress(keyData) {
  if (keyData.code === 'Settings') { if (settingsBarRef.value) { settingsBarRef.value.showSettings() }; return }
  setKeyActive(keyData.code, true)
  const mapping = getMapping(keyData.code)
  if (mapping) { setTimeout(() => { setKeyActive(keyData.code, false); launchMapping(mapping) }, 200) }
  else { setTimeout(() => { setKeyActive(keyData.code, false) }, 200) }
}

function handleKeyConfig(keyData) {
  if (keyData.code === 'Settings') { if (settingsBarRef.value) { settingsBarRef.value.showSettings() }; return }
  currentKey.value = keyData
  configPanelVisible.value = true
}

async function handleSaveMapping(keyCode, mapping) { if (await updateMapping(keyCode, mapping)) { configPanelVisible.value = false } }
async function handleDeleteMapping(keyCode) { if (await deleteMapping(keyCode)) { configPanelVisible.value = false } }
function handleHotkeyChange(newHotkey) { console.log('Hotkey updated to:', newHotkey) }

async function handleOpacityChange(newOpacity) {
  if (window.electronAPI) { await window.electronAPI.updateOpacity(newOpacity) }
  await saveConfig({ hotkey: hotkey.value, opacity: newOpacity, bgOpacity: bgOpacity.value, keySize: keySize.value, keyGap: keyGap.value, mappings: mappings.value })
}

async function handleBgOpacityChange(newBgOpacity) {
  if (window.electronAPI) { await window.electronAPI.updateBgOpacity(newBgOpacity) }
  await saveConfig({ hotkey: hotkey.value, opacity: opacity.value, bgOpacity: newBgOpacity, keySize: keySize.value, keyGap: keyGap.value, mappings: mappings.value })
}

async function handleKeySizeChange(newKeySize) { await saveConfig({ hotkey: hotkey.value, opacity: opacity.value, bgOpacity: bgOpacity.value, keySize: newKeySize, keyGap: keyGap.value, mappings: mappings.value }) }
async function handleKeyGapChange(newKeyGap) { await saveConfig({ hotkey: hotkey.value, opacity: opacity.value, bgOpacity: bgOpacity.value, keySize: keySize.value, keyGap: newKeyGap, mappings: mappings.value }) }
function setKeyActive(code, active) { if (keyboardRef.value) { keyboardRef.value.setKeyActive(code, active) } }
async function onPhysicalKeyPress(e, code) { if (code === 'Settings') return; const m = getMapping(code); if (m) { await launchMapping(m) } }
const { disabled } = useKeyboard(onPhysicalKeyPress, setKeyActive)
watch(configPanelVisible, (visible) => { disabled.value = visible })
onMounted(() => { if (window.electronAPI && window.electronAPI.onBgOpacityUpdate) { window.electronAPI.onBgOpacityUpdate((val) => { console.log('bg opacity updated:', val) }) } })
