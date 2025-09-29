<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
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
                  <button type="button" class="remove-airdrop" @click="removeAirdrop(index)">
                    ×
                  </button>
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
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <button type="button" class="btn-clear" @click="clearCurrentDayData">清空</button>
        </div>
        <div class="footer-right">
          <button type="button" class="btn-cancel" @click="closeModal">取消</button>
          <button type="button" class="btn-save" @click="saveRecord">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import type { DateRecord } from '@/types'

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

const store = useAppStore()
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
  const fastConfig = store.currentConfig?.fastConfig
  if (fastConfig) {
    if (fastConfig.fee) formData.value.fee = parseFloat(fastConfig.fee) || 0
    if (fastConfig.todayScore) formData.value.todayScore = parseInt(fastConfig.todayScore) || 0
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
      score: coin.score,
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
      const currentUser = store.currentUser
      if (!currentUser) {
        throw new Error('未找到用户信息')
      }

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
      currentUser.date = currentUser.date.filter((item) => item.date !== props.selectedDate)

      // 添加新记录
      currentUser.date.push(newRecord)

      // 去重和排序
      currentUser.date = removeDuplicateRecords(currentUser.date)
      currentUser.date.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // 更新数据
      store.profitData.data[currentUser.config.userName] = currentUser

      // 保存到API
      const success = await store.updateData(store.profitData)
      if (!success) {
        throw new Error('保存失败')
      }
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

      const currentUser = store.currentUser
      if (!currentUser) {
        throw new Error('未找到用户信息')
      }

      // 删除该日期的所有记录
      currentUser.date = currentUser.date.filter((item) => item.date !== props.selectedDate)

      // 更新数据
      store.profitData.data[currentUser.config.userName] = currentUser

      // 保存到API
      const success = await store.updateData(store.profitData)
      if (!success) {
        throw new Error('清空失败')
      }
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
      if (props.selectedDate && store.currentUser) {
        const existingData = store.currentUser.date.find((item) => item.date === props.selectedDate)
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }
}

.modal-body {
  padding: 20px;

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
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);

  .footer-left {
    .btn-clear {
      background: var(--warning);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--warning-dark);
      }
    }
  }

  .footer-right {
    display: flex;
    gap: 10px;

    .btn-cancel {
      background: none;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }

    .btn-save {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--primary-dark);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .score-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .airdrop-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
}
</style>
