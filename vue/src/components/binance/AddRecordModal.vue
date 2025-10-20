<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    size="medium"
    cancel-text="取消"
    confirm-text="保存"
    @close="closeModal"
    @confirm="saveRecord"
  >
    <form @submit.prevent="saveRecord">
      <!-- 积分信息 -->
      <div class="score-row">
        <div class="form-group">
          <label>当前积分</label>
          <input v-model="formData.curScore" type="number" step="1" placeholder="0" />
        </div>

        <div class="form-group">
          <label>今日刷的积分</label>
          <input v-model="formData.todayScore" type="number" step="1" placeholder="0" />
        </div>

        <div class="form-group">
          <label>消耗积分</label>
          <input
            v-model="formData.consumptionScore"
            type="number"
            step="1"
            placeholder="0"
            readonly
            disabled
          />
        </div>

        <div class="form-group">
          <label>手续费</label>
          <input v-model="formData.fee" type="number" step="0.01" placeholder="0.00" />
        </div>
      </div>

      <!-- 空投信息 -->
      <div class="form-group lineBreak-group">
        <label>空投信息</label>
        <div class="airdrop-container">
          <div class="airdrop-list">
            <div v-for="(airdrop, index) in formData.coin" :key="index" class="airdrop-item">
              <input
                v-model="airdrop.name"
                type="text"
                class="airdrop-name"
                placeholder="输入空投名称"
                required
              />
              <input
                v-model="airdrop.amount"
                type="number"
                class="airdrop-income"
                step="0.01"
                placeholder="收入"
                required
              />
              <input
                v-model="airdrop.score"
                type="number"
                class="airdrop-consumption"
                step="1"
                placeholder="消耗积分"
                required
              />
              <button type="button" class="remove-airdrop" @click="removeAirdrop(index)">×</button>
            </div>
          </div>
          <button type="button" class="add-airdrop-btn" @click="addAirdrop">
            <span>+</span> 添加空投
          </button>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-group">
        <label>备注</label>
        <textarea v-model="formData.remark" placeholder="添加备注信息" rows="3"></textarea>
      </div>
    </form>

    <template #footer-left>
      <button type="button" class="btn-clear" @click="clearCurrentDayData">清空</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import { calculatePrevious15DaysScore } from '@/composables/useScoreCalculation'
import type { DateRecord, LogType } from '@/types'

// 获取 store
const appStore = useAppStore()

interface Props {
  visible: boolean
  selectedDate?: string
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedDate: '',
  isEditing: false,
})

const emit = defineEmits<{
  close: []
  success: []
}>()

const { withLoading } = useLoading()

// 表单数据
const formData = ref({
  curScore: '' as string | number,
  todayScore: '' as string | number,
  consumptionScore: 15 as string | number,
  fee: '' as string | number,
  coin: [
    {
      name: '',
      amount: '' as string | number,
      score: '' as string | number,
    },
  ],
  remark: '',
})

// 计算属性
const modalTitle = computed(() => {
  if (!props.selectedDate) return '记录'

  const date = new Date(props.selectedDate)
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  const action = props.isEditing ? '修改' : '新增'
  return `${action} ${formattedDate} 的记录`
})

// 监听消耗积分变化
watch(
  () => formData.value.coin,
  (newCoin) => {
    // 只统计有币名称的空投的消耗积分
    const totalConsumption = newCoin.reduce((sum, item) => {
      // 如果币名称为空，不统计消耗积分
      if (!item.name || item.name.trim() === '') {
        return sum
      }
      return sum + (Number(item.score) || 0)
    }, 0)
    formData.value.consumptionScore = totalConsumption || 0
  },
  { deep: true },
)

// 添加空投
const addAirdrop = () => {
  formData.value.coin.push({
    name: '',
    amount: '' as string | number,
    score: 15 as string | number,
  })
}

// 删除空投
const removeAirdrop = (index: number) => {
  if (formData.value.coin.length > 1) {
    formData.value.coin.splice(index, 1)
  }
}

// 填充快速配置
const fillWithFastConfig = () => {
  const fastConfig = appStore.binance.config?.fastConfig
  if (fastConfig) {
    if (fastConfig.fee) formData.value.fee = parseFloat(fastConfig.fee) || 0
    if (fastConfig.todayScore) formData.value.todayScore = parseInt(fastConfig.todayScore) || 0

    // 如果启用了自动计算当前积分，且当前积分为空，则自动计算
    if (
      fastConfig.autoCalcCurScore &&
      (!formData.value.curScore || formData.value.curScore === 0)
    ) {
      if (props.selectedDate) {
        const calculatedScore = calculatePrevious15DaysScore(props.selectedDate)
        formData.value.curScore = calculatedScore
      }
    }
  }
}

// 填充现有数据
const fillWithExistingData = (existingData: DateRecord) => {
  formData.value.curScore = existingData.curScore || 0
  formData.value.todayScore = existingData.todayScore || 0
  formData.value.consumptionScore = existingData.consumptionScore || 15
  formData.value.fee = existingData.fee || 0
  formData.value.remark = existingData.remark || ''

  if (existingData.coin && existingData.coin.length > 0) {
    formData.value.coin = existingData.coin.map((coin) => ({
      name: coin.name,
      amount: coin.amount,
      score: coin.score || 0,
    }))
  } else {
    formData.value.coin = [{ name: '', amount: '', score: 15 }]
  }
}

// 清空表单
const clearForm = () => {
  formData.value = {
    curScore: '',
    todayScore: '',
    consumptionScore: 15,
    fee: '',
    coin: [{ name: '', amount: '', score: 15 }],
    remark: '',
  }
}

// 保存记录
const saveRecord = async () => {
  try {
    await withLoading(async () => {
      if (!props.selectedDate) {
        throw new Error('请选择日期')
      }

      // 获取当前用户数据
      let userName = appStore.currentUserName
      if (!userName) {
        throw new Error('未找到用户信息')
      }

      // 获取旧记录（用于日志对比）
      const oldRecord = appStore.binance.profitData.find(
        (item: any) => item.date === props.selectedDate,
      )

      // 获取最新数据(避免在其他地方被改过)
      const latestData = await appStore.api.fetchData(userName)

      // 创建新记录
      const newRecord: DateRecord = {
        date: props.selectedDate,
        curScore: Number(formData.value.curScore) || 0,
        todayScore: Number(formData.value.todayScore) || 0,
        consumptionScore: Number(formData.value.consumptionScore) || 0,
        fee: Number(formData.value.fee) || 0,
        coin: formData.value.coin
          .filter((coin) => coin.name.trim())
          .map((coin) => ({
            name: coin.name,
            amount: Number(coin.amount) || 0,
            score: Number(coin.score) || 0,
          })),
        remark: formData.value.remark,
      }

      // 先删除该日期的记录（无论是否有数据）
      if (appStore.binance.profitData) {
        let newProfitData = appStore.binance.profitData.filter(
          (item: any) => item.date !== props.selectedDate,
        )

        // 添加新记录
        newProfitData.push(newRecord)

        // 去重和排序
        newProfitData = removeDuplicateRecords(newProfitData)
        newProfitData.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )

        appStore.binance.data!.date = newProfitData
      }

      // 准备日志信息
      const action = props.isEditing ? '修改记录' : '新增记录'
      const logEntry = {
        action,
        type: (props.isEditing ? 'editRecord' : 'addRecord') as LogType,
        details: JSON.stringify({
          oldData: oldRecord,
          newData: newRecord,
        }),
      }

      // 更新日志
      await appStore.log.createLogEntry(logEntry)
      // 更新数据
      await appStore.api.updateData()
    }, '保存记录中...')

    // 关闭弹窗
    closeModal()

    // 触发成功事件
    emit('success')

    // 显示成功提示
    const message = props.isEditing ? '记录修改成功！' : '记录新增成功！'
    window.GlobalPlugin.toast.success(message)
  } catch (error) {
    console.error('保存记录失败:', error)
    const errorMessage = error instanceof Error ? error.message : '保存失败，请重试'
    window.GlobalPlugin.toast.error('保存失败', errorMessage)
  }
}

// 清空当前日期数据
const clearCurrentDayData = async () => {
  try {
    await withLoading(async () => {
      if (!props.selectedDate) {
        throw new Error('请选择日期')
      }

      // 删除该日期的所有记录
      appStore.binance.data!.date = appStore.binance.data!.date.filter(
        (item: any) => item.date !== props.selectedDate,
      )

      // 准备日志信息
      const logEntry = {
        action: '清空记录',
        type: 'clearRecord' as const,
        details: `${props.selectedDate} 的数据已清空`,
      }

      // 更新日志
      await appStore.log.createLogEntry(logEntry)
      // 更新数据
      await appStore.api.updateData()
    }, '清空数据中...')

    // 关闭弹窗
    closeModal()

    // 触发成功事件
    emit('success')

    // 显示成功提示
    window.GlobalPlugin.toast.success('数据已清空')
  } catch (error) {
    console.error('清空数据失败:', error)
    const errorMessage = error instanceof Error ? error.message : '清空失败，请重试'
    window.GlobalPlugin.toast.error('清空失败', errorMessage)
  }
}

// 去重函数
const removeDuplicateRecords = (records: DateRecord[]): DateRecord[] => {
  const seen = new Set()
  return records.filter((record) => {
    const key = `${record.date}-${record.coin?.map((c) => c.name).join(',')}-${record.fee}-${record.curScore}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 清空表单
      clearForm()

      // 检查是否有现有数据
      if (props.selectedDate && appStore.currentUser) {
        const existingData = appStore.currentUser.binance.date.find(
          (item) => item.date === props.selectedDate,
        )
        if (existingData) {
          fillWithExistingData(existingData)
        } else {
          fillWithFastConfig()
        }
      } else {
        fillWithFastConfig()
      }
    }
  },
)
</script>

<style lang="scss" scoped>
.score-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  .form-group {
    flex: 1;
    min-width: 120px;
  }
}

.form-group {
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-primary);
  }

  input,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: var(--primary);
    }

    &:disabled {
      background: var(--bg-tertiary);
      color: var(--text-muted);
      cursor: not-allowed;
    }
  }

  textarea {
    min-height: 60px;
    resize: vertical;
  }

  &.lineBreak-group {
    margin-bottom: 15px;
  }
}

.airdrop-container {
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
  .airdrop-list {
    margin-bottom: 12px;

    .airdrop-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;

      input {
        margin-bottom: 0;
      }

      .remove-airdrop {
        background: var(--error);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.1);
          font-size: 17px;
        }
      }
    }
  }

  .add-airdrop-btn {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      background: var(--primary-dark);
    }

    span {
      font-size: 16px;
      font-weight: bold;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .score-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .airdrop-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
