<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    size="medium"
    @close="closeModal"
    @confirm="saveRecord"
  >
    <form @submit.prevent="saveRecord">
      <!-- 手续费信息 -->
      <div class="fee-row">
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

    <template #footer-right>
      <button type="button" class="btn-cancel" @click="closeModal">取消</button>
      <button type="button" class="btn-save" @click="saveRecord">保存</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
import { useLoading } from '@/composables/useLoading'
import BaseModal from '@/components/common/BaseModal.vue'
import { fetchDataFromAPI } from '@/api'
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
  fee: '' as string | number,
  coin: [
    {
      name: '',
      amount: '' as string | number,
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

// 添加空投
const addAirdrop = () => {
  formData.value.coin.push({
    name: '',
    amount: '' as string | number,
  })
}

// 删除空投
const removeAirdrop = (index: number) => {
  if (formData.value.coin.length > 1) {
    formData.value.coin.splice(index, 1)
  }
}

// 填充现有数据
const fillWithExistingData = (existingData: DateRecord) => {
  formData.value.fee = existingData.fee || 0
  formData.value.remark = existingData.remark || ''

  if (existingData.coin && existingData.coin.length > 0) {
    formData.value.coin = existingData.coin.map((coin) => ({
      name: coin.name,
      amount: coin.amount,
    }))
  } else {
    formData.value.coin = [{ name: '', amount: '' }]
  }
}

// 清空表单
const clearForm = () => {
  formData.value = {
    fee: '',
    coin: [{ name: '', amount: '' }],
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
      let currentUser = store.currentUser
      if (!currentUser) {
        throw new Error('未找到用户信息')
      }

      // 获取最新数据
      const latestData = await fetchDataFromAPI()

      // 合并最新数据到 store
      store.profitData = latestData

      // 重新获取当前用户数据（可能已被其他用户修改）
      currentUser = store.profitData.data[currentUser.config.userName]

      // 获取旧记录（用于日志对比）
      const oldRecord = appStore.currentUser?.okx?.date.find(
        (item: any) => item.date === props.selectedDate,
      )

      // 创建新记录
      const newRecord: DateRecord = {
        date: props.selectedDate,
        fee: Number(formData.value.fee) || 0,
        coin: formData.value.coin
          .filter((coin) => coin.name.trim())
          .map((coin) => ({
            name: coin.name,
            amount: Number(coin.amount) || 0,
            score: 0, // OKX 不需要积分
          })),
        remark: formData.value.remark,
      }

      // 先删除该日期的记录（无论是否有数据）
      if (appStore.currentUser?.okx?.date) {
        appStore.currentUser.okx.date = appStore.currentUser.okx.date.filter(
          (item: any) => item.date !== props.selectedDate,
        )

        // 添加新记录
        appStore.currentUser.okx.date.push(newRecord)

        // 去重和排序
        appStore.currentUser.okx.date = removeDuplicateRecords(appStore.currentUser.okx.date)
        appStore.currentUser.okx.date.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
      }

      // 先更新 store.currentUser，让 createLogEntry 能正确访问
      store.currentUser = currentUser
      store.profitData.data[currentUser.config.userName] = currentUser

      // 准备日志信息
      const action = props.isEditing ? '修改记录' : '新增记录'
      const logEntry = {
        action,
        type: (props.isEditing ? 'editRecord' : 'addRecord') as 'editRecord' | 'addRecord',
        details: JSON.stringify({
          oldData: oldRecord,
          newData: newRecord,
        }),
      }

      // 一次性保存数据和日志
      await appStore.api.updateData(logEntry, 'okx')
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
      if (appStore.currentUser?.okx?.date) {
        appStore.currentUser.okx.date = appStore.currentUser.okx.date.filter(
          (item: any) => item.date !== props.selectedDate,
        )
      }

      // 先更新 store.currentUser，让 createLogEntry 能正确访问
      store.currentUser = currentUser
      store.profitData.data[currentUser.config.userName] = currentUser

      // 准备日志信息
      const logEntry = {
        action: '清空记录',
        type: 'clearRecord' as const,
        details: `${props.selectedDate} 的数据已清空`,
      }

      // 一次性保存数据和日志
      await appStore.api.updateData(logEntry, 'okx')
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
    const key = `${record.date}-${record.coin?.map((c) => c.name).join(',')}-${record.fee}`
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
        const existingData = appStore.currentUser?.okx?.date.find(
          (item: any) => item.date === props.selectedDate,
        )
        if (existingData) {
          fillWithExistingData(existingData)
        }
      }
    }
  },
)
</script>

<style lang="scss" scoped>
.fee-row {
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
      grid-template-columns: 2fr 1fr auto;
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
    opacity: 0.8;
  }
}

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
    opacity: 0.8;
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
    opacity: 0.8;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fee-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .airdrop-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
