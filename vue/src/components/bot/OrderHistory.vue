<template>
  <section class="orders-section">
    <div class="orders-header">
      <h2>订单历史</h2>
      <button class="btn-refresh" @click="handleRefresh" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="orders-table">
      <table>
        <thead>
          <tr>
            <th>订单ID</th>
            <th>交易对</th>
            <th>方向</th>
            <th>触发价格</th>
            <th>数量</th>
            <th>交易金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in botStore.orders" :key="order.orderId">
            <td>{{ order.orderId }}</td>
            <td>{{ order.symbol }}</td>
            <td :class="order.side.toLowerCase()">{{ order.side }}</td>
            <td>{{ formatNumber(order.price) }}</td>
            <td>{{ formatNumber(order.origQty) }}</td>
            <td>{{ formatNumber(order.origQuoteOrderQty) }}</td>
            <td :class="order.status.toLowerCase()">
              {{ getStatusText(order.status) }}
            </td>
            <td>{{ order.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBotStore } from '@/stores/bot'

const botStore = useBotStore()
const loading = ref(false)

import { formatNumber } from '@/utils/format'

// 状态中文化
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    NEW: '新建',
    PARTIALLY_FILLED: '部分成交',
    FILLED: '已成交',
    CANCELED: '已取消',
    PENDING_CANCEL: '取消中',
    REJECTED: '已拒绝',
    EXPIRED: '已过期',
    EXPIRED_IN_MATCH: '撮合过期',
  }

  return statusMap[status] || status
}

// 处理刷新
const handleRefresh = async () => {
  if (loading.value) return

  loading.value = true
  await botStore.refreshOrders()
  loading.value = false
}
</script>

<style lang="scss" scoped>
.orders-section {
  .orders-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .btn-refresh {
      padding: 8px 16px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #2563eb;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .orders-table {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;

    table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        padding: 12px 16px;
        text-align: center;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        background: var(--bg-secondary);
        font-weight: 600;
        color: var(--text-primary);
        font-size: 14px;
      }

      td {
        font-size: 14px;
        color: var(--text-primary);

        &.buy {
          color: var(--success);
        }

        &.sell {
          color: var(--error);
        }

        &.filled {
          color: var(--success);
        }

        &.pending {
          color: var(--warning);
        }

        &.cancelled {
          color: var(--error);
        }

        &.insufficient_balance {
          color: var(--error);
          font-style: italic;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .orders-table {
    overflow-x: auto;

    table {
      min-width: 600px;
    }
  }
}
</style>
