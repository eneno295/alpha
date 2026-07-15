<template>
  <div class="income-page">
    <Header :show-log-icon="false" :show-fast-config-param="false" :show-theme-icon-param="false" />

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <GridCalculator v-if="activeTab === 'grid'" />
    <CompoundCalculator v-else-if="activeTab === 'compound'" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Header from '@/components/common/Header.vue'
import GridCalculator from '@/components/income/grid/GridCalculator.vue'
import CompoundCalculator from '@/components/income/compound/CompoundCalculator.vue'
import { useAppInitialization } from '@/composables/useAppInitialization'

type TabKey = 'grid' | 'compound'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'grid', label: '网格' },
  { key: 'compound', label: '复利' },
]

const activeTab = ref<TabKey>('grid')

const { initializeApp } = useAppInitialization()

// income 页面刷新时主动拉一次数据（该页面本身没有复用其它页面的生命周期初始化）
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
  display: flex;
  gap: 8px;
}

.tab-btn {
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
</style>
