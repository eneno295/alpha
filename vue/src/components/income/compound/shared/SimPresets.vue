<template>
  <div class="sim-block">
    <span class="tip sim-title">模拟数据：</span>
    <div v-for="group in simulationPresets" :key="group.group" class="preset-line">
      <span class="group-label">{{ group.group }}</span>
      <button
        v-for="preset in group.presets"
        :key="preset.key"
        class="preset-btn"
        type="button"
        @click="$emit('apply', preset.key)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { simulationPresets } from '../presets'

defineEmits<{
  (e: 'apply', key: string): void
}>()
</script>

<style lang="scss" scoped>
.sim-block {
  margin-top: 12px;
}

.tip {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.sim-title {
  display: block;
  margin: 0;
}

.preset-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.group-label {
  flex-shrink: 0;
  min-width: 42px;
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}

.preset-btn {
  border: 1px solid var(--line);
  color: var(--text);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    border-color: var(--accent);
  }
}
</style>
