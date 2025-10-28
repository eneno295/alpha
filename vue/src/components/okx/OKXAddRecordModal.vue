<template>
  <BaseModal
    :visible="visible"
    :title="`${selectedDate} - 设置 OKX 收益`"
    size="large"
    :show-footer="false"
    @close="closeModal"
  >
    <div class="accounts-modal">
      <!-- 账号列表 -->
      <div class="accounts-list">
        <div
          v-for="account in availableAccounts"
          :key="account"
          class="account-card"
          @click="openAccountEdit(account)"
        >
          <div class="account-header">
            <h4>{{ account }}</h4>
            <div class="account-status">
              <span
                :class="{
                  'status-set': getAccountStatus(account) === '已设置',
                  'status-modified': getAccountStatus(account) === '已修改',
                  'status-added': getAccountStatus(account) === '已添加',
                  'status-cleared': getAccountStatus(account) === '已清空',
                  'status-cleared-added': getAccountStatus(account) === '已清空添加',
                  'status-empty': getAccountStatus(account) === '未设置',
                }"
              >
                {{ getAccountStatus(account) }}
              </span>
            </div>
          </div>

          <div v-if="getAccountData(account)" class="account-summary">
            <div class="summary-item">
              <span class="label">币种:</span>
              <span class="value">{{ getCoinNames(account) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">总收益:</span>
              <span class="value income">${{ formatDecimal(getTotalIncome(account)) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">手续费:</span>
              <span class="value">{{ formatDecimal(getAccountData(account)?.fee || 0) }} USDT</span>
            </div>
          </div>

          <div v-else class="account-empty">
            <p>点击设置该账号的收益数据</p>
          </div>

          <div class="account-actions">
            <button
              v-if="getAccountData(account)"
              class="btn-clear"
              @click.stop="clearAccountData(account)"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="closeModal">取消</button>
        <button type="button" class="btn-save" @click="saveAllData" :disabled="!hasAnyData">
          保存全部
        </button>
      </div>
    </div>

    <!-- 账号编辑小弹窗 -->
    <OKXAccountEditModal
      :visible="showAccountEdit"
      :selectedAccount="selectedAccount"
      :selectedDate="selectedDate"
      :existingData="getAccountData(selectedAccount) || undefined"
      @close="closeAccountEdit"
      @save="saveAccountData"
      @clear="clearAccountData"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import { formatDecimal } from '@/utils/format'
import type { LogType } from '@/types'

// Props
interface Props {
  visible: boolean
  selectedDate?: string
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedDate: '',
  isEditing: false,
})

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Store
const appStore = useAppStore()
const { withLoading } = useLoading()

// 小弹窗状态
const showAccountEdit = ref(false)
const selectedAccount = ref('')

// 临时数据存储（用于批量保存）
const tempAccountData = ref<
  Record<
    string,
    {
      coins: Array<{ name: string; amount: number }>
      fee: number
      remark: string
      _cleared?: boolean // 标记是否已清空
      _wasCleared?: boolean // 标记是否曾经清空过（清空后又添加）
    }
  >
>({})

// OKX 可用账号列表（从 OKX 的 accounts 中获取，按 order 排序）
const availableAccounts = computed(() => {
  if (!appStore.okx.data?.accounts) return []

  // 获取所有账号并按 order 排序
  return Object.entries(appStore.okx.data.accounts)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([name]) => name)
})

// 是否有任何数据
const hasAnyData = computed(() => {
  return Object.keys(tempAccountData.value).length > 0
})

// 获取账号数据（优先从临时数据，其次从现有数据）
const getAccountData = (
  account: string,
):
  | {
      coins: Array<{ name: string; amount: number }>
      fee: number
      remark: string
    }
  | undefined => {
  // 先检查临时数据
  if (tempAccountData.value[account]) {
    // 如果标记为已清空，返回 undefined
    if (tempAccountData.value[account]._cleared) {
      return undefined
    }
    return tempAccountData.value[account]
  }

  // 再检查现有数据
  const accountData = appStore.okx.data?.accounts?.[account]
  if (accountData) {
    const existingRecord = accountData.date.find((item: any) => item.date === props.selectedDate)
    if (existingRecord) {
      return {
        coins: existingRecord.coin || [],
        fee: existingRecord.fee || 0,
        remark: existingRecord.remark || '',
      }
    }
  }

  return undefined
}

// 获取账号总收益
const getTotalIncome = (account: string) => {
  const data = getAccountData(account)
  if (!data) return 0

  return data.coins.reduce((total, coin) => {
    return total + (coin.amount || 0)
  }, 0)
}

// 获取币种名称列表
const getCoinNames = (account: string) => {
  const data = getAccountData(account)
  if (!data || !data.coins || data.coins.length === 0) return '-'

  return data.coins.map((coin) => coin.name).join(', ')
}

// 获取账号状态标签
const getAccountStatus = (account: string): string => {
  const tempData = tempAccountData.value[account]
  const originalData = appStore.okx.data?.accounts?.[account]?.date.find(
    (item: any) => item.date === props.selectedDate,
  )

  // 已清空
  if (tempData?._cleared) {
    return '已清空'
  }

  // 有临时数据（修改或新增）
  if (tempData && !tempData._cleared) {
    // 原数据不存在 → 已添加
    if (!originalData) {
      return '已添加'
    }
    // 原数据存在，且曾经清空过 → 已清空添加
    if (tempData._wasCleared) {
      return '已清空添加'
    }
    // 原数据存在，但有修改 → 已修改
    return '已修改'
  }

  // 没有临时数据，但有原数据 → 已设置
  if (originalData) {
    return '已设置'
  }

  // 没有任何数据 → 未设置
  return '未设置'
}

// 打开账号编辑弹窗
const openAccountEdit = (account: string) => {
  selectedAccount.value = account
  showAccountEdit.value = true
}

// 关闭账号编辑弹窗
const closeAccountEdit = () => {
  showAccountEdit.value = false
  selectedAccount.value = ''
}

// 保存账号数据（临时存储）
const saveAccountData = (data: {
  account: string
  date: string
  coins: Array<{ name: string; amount: number }>
  fee: number
  remark: string
}) => {
  // 检查是否之前被清空过
  const wasCleared = tempAccountData.value[data.account]?._cleared === true

  tempAccountData.value[data.account] = {
    coins: data.coins,
    fee: data.fee,
    remark: data.remark,
    _wasCleared: wasCleared, // 如果之前清空过，标记为已清空添加
  }
}

// 清空账号数据
const clearAccountData = (account: string) => {
  // 标记为已清空
  tempAccountData.value[account] = {
    coins: [],
    fee: 0,
    remark: '',
    _cleared: true,
  }
}

// 保存所有数据
const saveAllData = async () => {
  try {
    await withLoading(async () => {
      if (!props.selectedDate) {
        throw new Error('请选择日期')
      }

      // 准备日志信息（所有变更合并成一条日志）
      const logDetails = {
        date: props.selectedDate,
        accounts: [] as Array<{
          account: string
          type: 'add' | 'edit' | 'clear'
          oldData?: any
          newData?: any
        }>,
      }

      // 处理每个账号的数据
      for (const [account, data] of Object.entries(tempAccountData.value)) {
        // 获取旧记录
        const accountData = appStore.okx.data?.accounts?.[account]
        const oldRecord = accountData?.date.find((item: any) => item.date === props.selectedDate)

        // 如果标记为已清空
        if (data._cleared) {
          if (oldRecord) {
            logDetails.accounts.push({
              account,
              type: 'clear',
              oldData: oldRecord,
            })
          }
          continue
        }

        // 创建新记录
        const newRecord = {
          date: props.selectedDate,
          coin: data.coins
            .filter((coin) => coin.name.trim() && coin.amount > 0)
            .map((coin) => ({
              name: coin.name,
              amount: coin.amount,
              score: 0, // OKX 不需要积分，设为 0
            })),
          fee: data.fee || 0,
          remark: data.remark || undefined,
        }

        // 记录变更
        logDetails.accounts.push({
          account,
          type: oldRecord ? 'edit' : 'add',
          oldData: oldRecord,
          newData: newRecord,
        })
      }

      // 更新本地数据
      if (appStore.okx.data) {
        // 确保 accounts 结构存在
        if (!appStore.okx.data.accounts) {
          appStore.okx.data.accounts = {}
        }

        // 更新每个账号的数据
        for (const [account, data] of Object.entries(tempAccountData.value)) {
          if (!appStore.okx.data.accounts[account]) {
            // 计算新账号的 order（当前最大 order + 1）
            const maxOrder = Object.values(appStore.okx.data.accounts).reduce(
              (max, acc) => Math.max(max, acc.order),
              -1,
            )
            appStore.okx.data.accounts[account] = { date: [], order: maxOrder + 1 }
          }

          // 移除该日期的旧记录
          appStore.okx.data.accounts[account].date = appStore.okx.data.accounts[
            account
          ].date.filter((item: any) => item.date !== props.selectedDate)

          // 如果标记为已清空，跳过添加新记录
          if (data._cleared) {
            continue
          }

          // 添加新记录
          const newRecord = {
            date: props.selectedDate,
            coin: data.coins
              .filter((coin) => coin.name.trim() && coin.amount > 0)
              .map((coin) => ({
                name: coin.name,
                amount: coin.amount,
                score: 0, // OKX 不需要积分，设为 0
              })),
            fee: data.fee || 0,
            remark: data.remark || undefined,
          }

          appStore.okx.data.accounts[account].date.push(newRecord)

          // 排序
          appStore.okx.data.accounts[account].date.sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )
        }
      }

      // 保存日志（合并成一条记录）
      if (logDetails.accounts.length > 0) {
        // 生成日志描述
        const addCount = logDetails.accounts.filter((a) => a.type === 'add').length
        const editCount = logDetails.accounts.filter((a) => a.type === 'edit').length
        const clearCount = logDetails.accounts.filter((a) => a.type === 'clear').length

        const actionParts = []
        if (addCount > 0) actionParts.push(`新增${addCount}个`)
        if (editCount > 0) actionParts.push(`修改${editCount}个`)
        if (clearCount > 0) actionParts.push(`清空${clearCount}个`)

        const action = `账号记录(${actionParts.join('、')})`

        // 判断日志类型
        let logType: LogType = 'editRecord'
        if (addCount > 0 && editCount === 0 && clearCount === 0) {
          logType = 'addRecord'
        } else if (clearCount > 0 && addCount === 0 && editCount === 0) {
          logType = 'clearRecord'
        }

        await appStore.log.createLogEntry({
          action,
          type: logType,
          details: JSON.stringify(logDetails),
        })

        // 一次性提交所有修改到服务器
        await appStore.api.updateData()
      }
    }, '保存数据中...')

    // 清空临时数据
    tempAccountData.value = {}

    // 关闭弹窗
    closeModal()

    // 触发成功事件
    emit('success')
  } catch (error) {
    console.error('保存数据失败:', error)
  }
}

// 关闭弹窗
const closeModal = () => {
  // 清空临时数据
  tempAccountData.value = {}
  emit('close')
}

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 初始化时清空临时数据
      tempAccountData.value = {}
    }
  },
)

// 组件挂载时初始化
onMounted(() => {
  if (props.visible) {
    tempAccountData.value = {}
  }
})
</script>

<style lang="scss" scoped>
.accounts-modal {
  .accounts-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;

    .account-card {
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .account-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 600;
        }

        .account-status {
          span {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .status-set {
            background: #6b7280;
            color: white;
          }

          .status-modified {
            background: #3b82f6;
            color: white;
          }

          .status-added {
            background: #10b981;
            color: white;
          }

          .status-cleared {
            background: #f97316;
            color: white;
          }

          .status-cleared-added {
            background: #8b5cf6;
            color: white;
          }

          .status-empty {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
          }
        }
      }

      .account-summary {
        margin-bottom: 16px;

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            color: var(--text-secondary);
            font-size: 14px;
          }

          .value {
            font-weight: 600;
            font-size: 14px;

            &.income {
              color: var(--success);
            }
          }
        }
      }

      .account-empty {
        margin-bottom: 16px;
        text-align: center;
        padding: 20px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 1px dashed var(--border-color);

        p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
      }

      .account-actions {
        display: flex;
        gap: 8px;

        button {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &.btn-edit {
            background: var(--primary);
            color: white;

            &:hover {
              background: var(--primary-dark);
            }
          }
        }
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &.btn-cancel {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);

        &:hover {
          background: var(--bg-tertiary);
        }
      }

      &.btn-save {
        background: var(--primary);
        color: white;

        &:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        &:disabled {
          background: var(--bg-tertiary);
          color: var(--text-disabled);
          cursor: not-allowed;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .accounts-modal {
    .accounts-list {
      grid-template-columns: 1fr;
    }

    .modal-actions {
      flex-direction: column;

      button {
        width: 100%;
      }
    }
  }
}
</style>
