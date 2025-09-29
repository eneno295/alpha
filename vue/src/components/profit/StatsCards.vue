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
  position: relative;

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
    background: var(--bg-card);
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow: var(--shadow-md);
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 140px;
    flex-shrink: 0;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--gradient-primary);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
      border-color: var(--border-glow);

      &::before {
        opacity: 1;
      }
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;

      &.income {
        background: var(--gradient-success);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      &.projects {
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      &.profit {
        background: var(--gradient-warning);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      &.fees {
        background: var(--gradient-error);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
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
