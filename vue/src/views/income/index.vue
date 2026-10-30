<template>
  <div class="income-page">
    <Header :show-log-icon="false" :show-fast-config-param="false" :show-theme-icon-param="false" />

    <div class="tabs">
      <SegmentTabs v-model="activeTab" :tabs="tabs" />
    </div>

    <GridCalculator v-if="activeTab === 'grid'" />
    <Compound v-else-if="activeTab === 'compound'" />
    <ProfitCalculator v-else-if="activeTab === 'profit'" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Header from '@/components/common/Header.vue'
import SegmentTabs from '@/components/income/SegmentTabs.vue'
import GridCalculator from '@/components/income/grid/GridCalculator.vue'
import Compound from '@/components/income/compound/index.vue'
import ProfitCalculator from '@/components/income/profit/ProfitCalculator.vue'
import { useAppInitialization } from '@/composables/useAppInitialization'

type TabKey = 'grid' | 'compound' | 'profit'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'grid', label: '网格' },
  { key: 'compound', label: '复利' },
  { key: 'profit', label: '收益' },
]

const activeTab = ref<TabKey>('grid')

const { initializeApp } = useAppInitialization()

onMounted(() => {
  initializeApp()
})
</script>

<style lang="scss" scoped>
:deep(.header) {
  --header-bg: var(--bg);
}
.income-page {
  --bg: #0b1020;
  --card: #131a31;
  --card-2: #1a2342;
  --text: #eef3ff;
  --muted: #9fb1d9;
  --ok: #38d39f;
  --warn: #ffca57;
  --bad: #ff6b6b;
  --line: rgba(255, 255, 255, 0.08);
  --accent: #6ea8ff;
  color: var(--text);
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 80% -20%, rgba(110, 168, 255, 0.2), transparent 60%),
    radial-gradient(1000px 500px at -10% 110%, rgba(56, 211, 159, 0.18), transparent 55%), var(--bg);
}

.tabs {
  max-width: 1080px;
  margin: 20px auto 0;
  padding: 0 16px;
}
</style>
