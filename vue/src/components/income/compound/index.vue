<template>
  <div class="wrap">
    <SegmentTabs v-model="mode" :tabs="modeTabs" size="sm" />
    <Full v-if="mode === 'full'" />
    <Visual v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SegmentTabs from '@/components/income/SegmentTabs.vue'
import Full from './full/index.vue'
import Visual from './visual/index.vue'

type ModeKey = 'full' | 'visual'

const modeTabs: { key: ModeKey; label: string }[] = [
  { key: 'full', label: '完整计算' },
  { key: 'visual', label: '复利拖动' },
]

const mode = ref<ModeKey>('full')
</script>

<style lang="scss" scoped>
.wrap {
  max-width: 1080px;
  margin: 28px auto 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px 32px;
}
</style>
