<template>
  <div class="segment-tabs" :class="size">
    <button
      v-for="tab in tabs"
      :key="String(tab.key)"
      class="segment-btn"
      :class="{ active: modelValue === tab.key }"
      type="button"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
export type SegmentTab<T extends string | number = string> = {
  key: T
  label: string
}

defineProps<{
  tabs: SegmentTab<T>[]
  modelValue: T
  size?: 'md' | 'sm'
}>()

defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()
</script>

<style lang="scss" scoped>
.segment-tabs {
  display: flex;
  gap: 8px;
}

.segment-btn {
  border: 1px solid var(--line);
  color: var(--muted);
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text);
  }

  &.active {
    color: #dce9ff;
    border-color: var(--accent);
    background: linear-gradient(180deg, rgba(110, 168, 255, 0.28), rgba(110, 168, 255, 0.12));
    box-shadow: 0 0 0 1px rgba(110, 168, 255, 0.25) inset;
  }
}

.segment-tabs.sm .segment-btn {
  padding: 7px 16px;
  font-size: 13px;
}
</style>
