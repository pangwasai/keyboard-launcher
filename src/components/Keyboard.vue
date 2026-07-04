<template>
  <div class="keyboard-wrapper" :style="{ '--key-gap': gap + 'px', '--row-gap': gap + 'px' }">
    <div v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex" :class="['keyboard-row', 'row-' + rowIndex]">
      <Key v-for="key in row" :key="key.code" :ref="el => setKeyRef(key.code, el)" :key-data="key" :mapping="mappings[key.code]" :base-width="baseWidth" :gap="gap" :opacity="opacity" @press="handleKeyPress" @config="handleKeyConfig" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Key from './Key.vue'
import { keyboardLayout } from '@/data/keyboardLayout'

const props = defineProps({ mappings: { type: Object, default: () => ({}) }, baseWidth: { type: Number, default: 68 }, gap: { type: Number, default: 10 }, opacity: { type: Number, default: 85 } })
const emit = defineEmits(['key-press', 'key-config'])
const keyRefs = ref({})
function setKeyRef(code, el) { if (el) { keyRefs.value[code] = el } }
function handleKeyPress(keyData) { emit('key-press', keyData) }
function handleKeyConfig(keyData) { emit('key-config', keyData) }
function setKeyActive(code, active) { const r = keyRefs.value[code]; if (r && r.setActive) { r.setActive(active) } }
defineExpose({ setKeyActive })
</script>
