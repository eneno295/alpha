<template>
  <div class="slider-row">
    <span class="slider-key">{{ label }}</span>
    <input
      class="slider-num"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="emitNumber(($event.target as HTMLInputElement).value)"
    />
    <span class="slider-unit">{{ unit }}</span>
    <input
      class="range"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="emitNumber(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import { toNum } from '@/utils/format'

defineProps<{
  modelValue: number
  label: string
  unit: string
  min: number
  max: number
  step: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

function emitNumber(raw: string) {
  emit('update:modelValue', toNum(raw))
}
</script>

<style lang="scss" scoped>
.slider-row {
  display: grid;
  grid-template-columns: 28px 88px 28px 1fr;
  align-items: center;
  gap: 8px;
}

.slider-key {
  font-weight: 700;
  font-size: 14px;
  color: var(--accent);
}

.slider-num {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 8px;
  font-size: 13px;
  outline: none;
}

.slider-unit {
  font-size: 12px;
  color: var(--muted);
}

.range {
  width: 100%;
  accent-color: #6ea8ff;
  cursor: pointer;
  height: 6px;
}
</style>
