<template>
  <div v-if="visible" class="overlay" @click.self="handleClose">
    <div class="config-panel">
      <h3>配置键位 - {{ keyLabel }}</h3>

      <div class="form-group">
        <label>映射类型</label>
        <select v-model="form.type">
          <option value="url">网站链接</option>
          <option value="folder">文件夹</option>
          <option value="app">应用程序</option>
          <option value="file">文件</option>
          <option value="text">文字</option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ targetLabel }}</label>
        <div class="input-with-btn" v-if="form.type !== 'text'">
          <input v-model="form.target" :placeholder="targetPlaceholder" type="text" />
          <button v-if="form.type === 'folder'" class="browse-btn" @click="browseFolder">浏览</button>
          <button v-if="form.type === 'app'" class="browse-btn" @click="browseFile">浏览</button>
          <button v-if="form.type === 'file'" class="browse-btn" @click="browseDocument">浏览</button>
        </div>
        <textarea v-else v-model="form.target" :placeholder="targetPlaceholder" rows="4" class="text-area"></textarea>
      </div>

      <div class="form-group">
        <label>显示图标</label>
        <div class="icon-preview-container" v-if="form.imageData">
          <img :src="form.imageData" class="icon-preview" />
          <button class="icon-remove-btn" @click="removeIcon">x</button>
        </div>
        <div class="icon-preview-placeholder" v-else><span>无图标</span></div>
        <div class="icon-actions">
          <button class="icon-action-btn" @click="captureScreenshot">截图</button>
          <button class="icon-action-btn" @click="browseImage">上传图片</button>
        </div>
      </div>

      <div class="form-group">
        <label>显示名称</label>
        <input v-model="form.label" placeholder="键位上显示的名称" type="text" />
      </div>

      <div class="form-group" v-if="form.label">
        <label>文字样式</label>
        <div class="style-row">
          <div class="style-item"><span class="style-label">颜色</span><input type="color" v-model="form.labelColor" class="color-picker" /></div>
          <div class="style-item"><span class="style-label">大小</span><input type="range" v-model="form.labelSize" min="8" max="16" step="1" class="size-slider" /><span class="size-value">{{ form.labelSize }}px</span></div>
        </div>
      </div>

      <div class="preview-group" v-if="form.label || form.imageData">
        <label>预览</label>
        <div class="key-preview" :style="{width:'68px',height:'68px'}">
          <template v-if="form.imageData"><img class="preview-icon" :src="form.imageData" alt="" /><span v-if="form.label" class="preview-label" :style="{color:form.labelColor,fontSize:form.labelSize+'px'}">{{ form.label }}</span></template>
          <span v-else class="preview-label" :style="{color:form.labelColor,fontSize:form.labelSize+'px'}">{{ form.label }}</span>
        </div>
      </div>

      <div class="btn-row">
        <button v-if="hasExisting" class="btn btn-danger" @click="handleDelete">删除</button>
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ visible: Boolean, keyData: { type: Object, default: null }, existingMapping: { type: Object, default: null } })
const emit = defineEmits(['save', 'delete', 'close'])

const form = ref({ type: 'url', target: '', label: '', imageData: '', labelColor: '#ffffff', labelSize: 10 })
const keyLabel = computed(() => props.keyData?.label || 'Unknown')
const hasExisting = computed(() => !!props.existingMapping)

const targetLabel = computed(() => { switch (form.value.type) { case 'url': return '网站地址'; case 'folder': return '文件夹路径'; case 'app': return '程序路径'; case 'file': return '文件路径'; case 'text': return '文本内容'; default: return '目标' } })
const targetPlaceholder = computed(() => { switch (form.value.type) { case 'url': return 'https://example.com'; case 'folder': return 'C:\\Users\\...'; case 'app': return 'C:\\...\\app.exe'; case 'file': return 'C:\\...\\document.pdf'; case 'text': return '输入要自动填充的文字...'; default: return '' } })

watch(() => props.visible, async (val) => {
  if (val) {
    if (window.electronAPI) { await window.electronAPI.configOpen() }
    if (props.existingMapping) { form.value = { type: props.existingMapping.type || 'url', target: props.existingMapping.target || '', label: props.existingMapping.label || '', imageData: props.existingMapping.imageData || '', labelColor: props.existingMapping.labelColor || '#ffffff', labelSize: props.existingMapping.labelSize || 10 } }
    else { form.value = { type: 'url', target: '', label: '', imageData: '', labelColor: '#ffffff', labelSize: 10 } }
  } else {
    if (window.electronAPI) { await window.electronAPI.configClose() }
  }
})

function handleSave() {
  if (form.value.type === 'text') { if (!form.value.target) { alert('请输入文本内容'); return } }
  else { if (!form.value.target.trim()) { alert('请输入目标路径或地址'); return } }
  const data = { ...form.value }
  if (!data.label) { delete data.labelColor; delete data.labelSize }
  emit('save', props.keyData.code, data)
}

function handleDelete() { if (confirm('确定要删除这个键位的映射吗？')) { emit('delete', props.keyData.code) } }
function handleClose() { emit('close') }
function removeIcon() { form.value.imageData = '' }

async function browseFile() { if (!window.electronAPI) { alert('不支持'); return }; const r = await window.electronAPI.openFileDialog(); if (r) form.value.target = r }
async function browseDocument() { if (!window.electronAPI) { alert('不支持'); return }; const r = await window.electronAPI.openDocumentDialog(); if (r) form.value.target = r }
async function browseFolder() { if (!window.electronAPI) { alert('不支持'); return }; const r = await window.electronAPI.openDirectoryDialog(); if (r) form.value.target = r }
async function browseImage() { if (!window.electronAPI) { alert('不支持'); return }; const r = await window.electronAPI.openImageDialog(); if (r) { try { const b = await (await fetch('file:///' + r)).blob(); const reader = new FileReader(); reader.onload = (e) => { form.value.imageData = e.target.result }; reader.readAsDataURL(b) } catch (err) { alert('读取图片失败') } } }
async function captureScreenshot() { if (!window.electronAPI) { alert('不支持'); return }; const r = await window.electronAPI.startScreenshot(); if (r && r.success && r.imageData) { form.value.imageData = r.imageData } else if (r && !r.success && r.error !== 'Cancelled') { alert('截图失败: ' + r.error) } }
</script>
