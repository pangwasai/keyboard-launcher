<template>
  <div class="keyboard-key" :class="{ active: isActive, 'settings-key': keyData.code === 'Settings', 'fully-opaque': opacity >= 100 }" :style="keyStyle" @click="handleClick" @contextmenu.prevent="handleRightClick">
    <template v-if="hasIcon"><img class="key-icon" :src="mapping.imageData" alt="" /><span v-if="hasLabelText" class="key-label-under-icon" :style="labelStyle">{{ mapping.label }}</span></template>
    <span v-else-if="hasLabelText" class="key-display-name" :style="labelStyle">{{ mapping.label }}</span>
    <span v-else class="key-label">{{ keyData.label }}</span>
    <span v-if="hasContent && keyData.code !== 'Settings'" class="key-corner-label">{{ keyData.label }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ keyData: { type: Object, required: true }, mapping: { type: Object, default: null }, baseWidth: { type: Number, default: 68 }, gap: { type: Number, default: 10 }, opacity: { type: Number, default: 85 } })
const emit = defineEmits(['press', 'config'])
const isActive = ref(false)
const keyStyle = computed(() => { const w = props.keyData.width || 1; return { width: (props.baseWidth * w + props.gap * (w - 1)) + 'px', height: props.baseWidth + 'px', '--key-bg-opacity': props.opacity >= 100 ? 1 : props.opacity / 100 } })
const labelStyle = computed(() => { const s = {}; if (props.mapping && props.mapping.labelColor) { s.color = props.mapping.labelColor }; if (props.mapping && props.mapping.labelSize) { s.fontSize = props.mapping.labelSize + 'px' }; return s })
const hasIcon = computed(() => props.mapping && props.mapping.imageData)
const hasLabelText = computed(() => props.mapping && props.mapping.label)
const hasContent = computed(() => hasIcon.value || hasLabelText.value)
function handleClick() { emit('press', props.keyData) }
function handleRightClick() { emit('config', props.keyData) }
function setActive(active) { isActive.value = active }
defineExpose({ setActive })
</script>
