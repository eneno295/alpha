<template>
  <div class="user-info">
    <div class="user-avatar">
      <span class="avatar-icon">👤</span>
    </div>
    <div class="user-details">
      <div class="username">{{ username }}</div>
      <div class="balance">
        <span class="balance-label">余额:</span>
        <span class="balance-value">{{ formatNumber(balance) }} USDT</span>
      </div>
    </div>
    <div class="refresh-btn" @click="refreshBalance" :disabled="loading">
      <span class="refresh-icon">{{ loading ? '⏳' : '🔄' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getAccountInfo } from '@/composables/useBinanceApi'

const username = ref('Binance User')
const balance = ref(0)
const loading = ref(false)
let refreshInterval: number | undefined

// 格式化数字，去除无用的0
const formatNumber = (value: string | number) => {
  if (!value) return '--'
  const num = parseFloat(value.toString())
  if (isNaN(num)) return value.toString()

  return num.toString()
}

// 刷新余额
const refreshBalance = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const accountInfo = await getAccountInfo()
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT')
    if (usdtBalance) {
      balance.value = parseFloat(usdtBalance.free)
    } else {
      balance.value = 0
    }
  } catch (error) {
    console.error('获取余额失败:', error)
    balance.value = 0
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取余额
onMounted(() => {
  refreshBalance()

  // 每30秒自动刷新余额
  refreshInterval = setInterval(refreshBalance, 30000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style lang="scss" scoped>
.user-info {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1000;
  min-width: 200px;

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .avatar-icon {
      font-size: 18px;
      color: white;
    }
  }

  .user-details {
    flex: 1;
    min-width: 0;

    .username {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .balance {
      display: flex;
      align-items: center;
      gap: 4px;

      .balance-label {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .balance-value {
        font-size: 12px;
        font-weight: 500;
        color: var(--success);
      }
    }
  }

  .refresh-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: var(--primary);
      border-color: var(--primary);

      .refresh-icon {
        color: white;
      }
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refresh-icon {
      font-size: 14px;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }
  }
}

@media (max-width: 768px) {
  .user-info {
    bottom: 10px;
    left: 10px;
    right: 10px;
    min-width: auto;
    padding: 10px 12px;

    .user-avatar {
      width: 36px;
      height: 36px;

      .avatar-icon {
        font-size: 16px;
      }
    }

    .user-details {
      .username {
        font-size: 13px;
      }

      .balance {
        .balance-label,
        .balance-value {
          font-size: 11px;
        }
      }
    }

    .refresh-btn {
      width: 28px;
      height: 28px;

      .refresh-icon {
        font-size: 12px;
      }
    }
  }
}
</style>
