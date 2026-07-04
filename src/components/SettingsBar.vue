<template>
  <div class="drag-bar">
    <div class="title">Keyboard Launcher</div>
    <div class="actions"><button class="action-btn" title="最小化" @click="hideWindow">-</button></div>
  </div>
  <div v-if="settingsDialogVisible" class="overlay" @click.self="settingsDialogVisible = false">
    <div class="config-panel">
      <h3>全局设置</h3>
      <div class="form-group"><label>快捷键</label><input v-model="hotkeyInput" placeholder="例如: Alt+Space, Ctrl+Shift+K" type="text" /></div>
      <div class="form-group"><label>背景透明度: {{ bgOpacity }}%</label><input v-model="bgOpacity" type="range" min="10" max="80" step="1" @input="updateBgOpacity" /></div>
      <div class="form-group"><label>按键透明度: {{ opacity }}%</label><input v-model="opacity" type="range" min="30" max="100" step="1" @input="updateOpacity" /></div>
      <div class="form-group"><label>按键大小: {{ keySize }}px</label><input v-model="keySize" type="range" min="40" max="100" step="2" @input="updateKeySize" /></div>
      <div class="form-group"><label>按键间隙: {{ keyGap }}px</label><input v-model="keyGap" type="range" min="4" max="20" step="1" @input="updateKeyGap" /></div>
      <div class="btn-row"><button class="btn btn-secondary" @click="settingsDialogVisible = false">关闭</button><button class="btn btn-primary" @click="saveSettings">保存</button></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({ currentHotkey: { type: String, default: 'Ctrl+Shift+Space' }, currentOpacity: { type: Number, default: 85 }, currentBgOpacity: { type: Number, default: 30 }, currentKeySize: { type: Number, default: 68 }, currentKeyGap: { type: Number, default: 10 } })
const emit = defineEmits(['hotkey-change', 'opacity-change', 'bg-opacity-change', 'key-size-change', 'key-gap-change'])

const settingsDialogVisible = ref(false)
const hotkeyInput = ref(props.currentHotkey)
const opacity = ref(props.currentOpacity)
const bgOpacity = ref(props.currentBgOpacity)
const keySize = ref(props.currentKeySize)
const keyGap = ref(props.currentKeyGap)

onMounted(() => { hotkeyInput.value = props.currentHotkey; opacity.value = props.currentOpacity; bgOpacity.value = props.currentBgOpacity; keySize.value = props.currentKeySize; keyGap.value = props.currentKeyGap })
watch(() => props.currentHotkey, (val) => { hotkeyInput.value = val })
watch(() => props.currentOpacity, (val) => { opacity.value = val })
watch(() => props.currentBgOpacity, (val) => { bgOpacity.value = val })
watch(() => props.currentKeySize, (val) => { keySize.value = val })
watch(() => props.currentKeyGap, (val) => { keyGap.value = val })

function showSettings() { hotkeyInput.value = props.currentHotkey; opacity.value = props.currentOpacity; bgOpacity.value = props.currentBgOpacity; keySize.value = props.currentKeySize; keyGap.value = props.currentKeyGap; settingsDialogVisible.value = true }

async function saveSettings() {
  if (!hotkeyInput.value.trim()) { alert('请输入快捷键'); return }
  if (window.electronAPI) {
    const r = await window.electronAPI.updateHotkey(hotkeyInput.value.trim())
    if (r && !r.success) { alert('热键设置失败，可能与其他程序冲突'); return }
    emit('hotkey-change', hotkeyInput.value.trim())
  }
  emit('opacity-change', opacity.value)
  emit('bg-opacity-change', bgOpacity.value)
  emit('key-size-change', keySize.value)
  emit('key-gap-change', keyGap.value)
  settingsDialogVisible.value = false
}

async function updateOpacity() { emit('opacity-change', opacity.value) }
async function updateBgOpacity() { emit('bg-opacity-change', bgOpacity.value) }
async function updateKeySize() { emit('key-size-change', keySize.value) }
async function updateKeyGap() { emit('key-gap-change', keyGap.value) }
function hideWindow() { if (window.electronAPI) { window.electronAPI.hideWindow() } }

defineExpose({ showSettings })
</script>
