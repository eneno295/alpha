<template>
  <div class="okx-stats-cards">
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-value projects">{{ totalProjects }}</div>
          <div class="stat-label">空投项目</div>
        </div>
        <div class="stat-card">
          <div class="stat-value income">${{ totalIncome.toFixed(1) }}</div>
          <div class="stat-label">空投收入</div>
        </div>
        <div class="stat-card">
          <div class="stat-value fees">${{ totalFees.toFixed(1) }}</div>
          <div class="stat-label">手续费收入</div>
        </div>
        <div class="stat-card">
          <div class="stat-value profit">${{ totalProfit.toFixed(1) }}</div>
          <div class="stat-label">总收入</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 计算总空投项目数
const totalProjects = computed(() => {
  const userData = appStore.currentUser
  if (!userData?.okx?.date) return 0

  let count = 0
  userData.okx.date.forEach((item: any) => {
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

// 计算空投总收入
const totalIncome = computed(() => {
  const userData = appStore.currentUser
  if (!userData?.okx?.date) return 0

  let total = 0
  userData.okx.date.forEach((item: any) => {
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

// 计算手续费总收入
const totalFees = computed(() => {
  const userData = appStore.currentUser
  if (!userData?.okx?.date) return 0

  let total = 0
  userData.okx.date.forEach((item: any) => {
    total += item.fee || 0
  })
  return total
})

// 计算总收入：空投收入 + 手续费收入
const totalProfit = computed(() => {
  return totalIncome.value + totalFees.value
})
</script>

<style lang="scss" scoped>
// 统计卡片区域
.stats-section {
  padding: 20px 18px;
  position: relative;
  z-index: 1;

  .stats-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    max-width: 1000px;
    margin: 0 auto;

    .stat-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 12px;
      border-radius: 20px;
      text-align: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-8px) scale(1.03);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.3);

        &::before {
          opacity: 1;
        }

        &::after {
          opacity: 1;
        }

        .stat-value {
          transform: scale(1.1);
        }
      }

      // 特殊卡片效果
      &:nth-child(1) {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
      }

      &:nth-child(2) {
        background: rgba(34, 197, 94, 0.1);
        border-color: rgba(34, 197, 94, 0.3);
      }

      &:nth-child(3) {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
      }

      &:nth-child(4) {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
      }
    }

    .stat-value {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 5px;
      position: relative;
      z-index: 2;
      transition: transform 0.3s ease;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

      &.income {
        background: linear-gradient(135deg, #4ade80, #22c55e, #16a34a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      &.projects {
        background: linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      &.profit {
        background: linear-gradient(135deg, #f59e0b, #d97706, #b45309);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      &.fees {
        background: linear-gradient(135deg, #ef4444, #dc2626, #b91c1c);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
      position: relative;
      z-index: 2;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stats-section {
    padding: 15px;
    .stats-container {
      // grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      .stat-card {
        padding: 15px;
      }
      .stat-value {
        font-size: 16px;
        margin-bottom: 0;
      }
      .stat-label {
        font-size: 12px;
      }
    }
  }
}
</style>
