<template>
  <section class="stats-section">
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-value projects">{{ totalProjects }}</div>
        <div class="stat-label">项目总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value income">${{ totalIncome.toFixed(1) }}</div>
        <div class="stat-label">累计收入</div>
      </div>
      <div class="stat-card">
        <div class="stat-value fees">${{ totalFees.toFixed(1) }}</div>
        <div class="stat-label">手续费</div>
      </div>
      <div class="stat-card">
        <div class="stat-value profit">${{ totalProfit.toFixed(1) }}</div>
        <div class="stat-label">利润</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 计算总项目数
const totalProjects = computed(() => {
  const userData = appStore.currentUser
  if (!userData?.date) return 0

  let count = 0
  userData.date.forEach((item) => {
    if (item.coin && Array.isArray(item.coin)) {
      item.coin.forEach((coin: any) => {
        if (coin.name && coin.amount > 0) {
          count++
        }
      })
    }
  })
  return count
})

// 计算累计收入
const totalIncome = computed(() => {
  const userData = appStore.currentUser
  if (!userData?.date) return 0

  let total = 0
  userData.date.forEach((item) => {
    if (item.coin && Array.isArray(item.coin)) {
      item.coin.forEach((coin: any) => {
        if (coin.name && coin.amount > 0) {
          total += coin.amount
        }
      })
    }
  })
  return total
})

// 计算总手续费
const totalFees = computed(() => {
  const userData = appStore.currentUser
  if (!userData?.date) return 0

  let total = 0
  userData.date.forEach((item) => {
    total += item.fee || 0
  })
  return total
})

// 计算利润：收入减去手续费
const totalProfit = computed(() => {
  return totalIncome.value - totalFees.value
})
</script>

<style lang="scss" scoped>
.stats-section {
  padding: 16px 24px;
  background: var(--bg-secondary);

  .stats-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
    flex-wrap: wrap;
  }

  .stat-card {
    background: var(--bg-primary);
    padding: 11px 16px;
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    text-align: center;
    transition: all 0.3s ease;
    min-width: 140px;
    flex-shrink: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .stat-value {
      font-size: 19px;
      font-weight: 700;
      margin-bottom: 8px;

      &.income {
        color: var(--success);
      }
      &.projects {
        color: var(--primary);
      }
      &.profit {
        color: var(--warning);
      }
      &.fees {
        color: var(--error);
      }
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
    }
  }
}

/* 简化的响应式设计 */
@media (max-width: 600px) {
  .stats-section {
    .stats-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }
}
</style>
