<template>
  <BaseModal
    :visible="visible"
    :title="`${selectedDate} - ${selectedAccount}`"
    size="medium"
    cancel-text="取消"
    confirm-text="保存"
    @close="closeModal"
    @confirm="saveData"
  >
    <form @submit.prevent="saveData">
      <!-- 空投信息 -->
      <div class="form-group">
        <label>空投信息</label>
        <div class="airdrop-container">
          <div class="airdrop-list">
            <div v-for="(coin, index) in formData.coins" :key="index" class="airdrop-item">
              <input
                v-model="coin.name"
                type="text"
                class="airdrop-name"
                placeholder="币种名称 (如: BTC, ETH)"
                required
              />
              <input
                v-model="coin.amount"
                type="number"
                class="airdrop-income"
                step="0.000001"
                placeholder="收入 (USDT)"
                required
              />
              <button type="button" class="remove-airdrop" @click="removeCoin(index)">×</button>
            </div>
          </div>
          <button type="button" class="add-airdrop-btn" @click="addCoin">
            <span>+</span> 添加币种
          </button>
        </div>
      </div>

      <!-- 手续费 -->
      <div class="form-group">
        <label>手续费 (USDT)</label>
        <input v-model="formData.fee" type="number" step="0.01" placeholder="0" />
      </div>

      <!-- 备注 -->
      <div class="form-group">
        <label>备注</label>
        <textarea v-model="formData.remark" placeholder="可选备注信息..." rows="3"></textarea>
      </div>
    </form>

    <template #footer-left>
      <button type="button" class="btn-clear" @click="clearData">清空</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// Props
interface Props {
  visible: boolean
  selectedAccount: string
  selectedDate: string
  existingData?: {
    coins: Array<{ name: string; amount: number | null }>
    fee?: number
    remark?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  existingData: undefined,
})

// Emits
const emit = defineEmits<{
  close: []
  save: [
    data: {
      account: string
      date: string
      coins: Array<{ name: string; amount: number }>
      fee: number
      remark: string
    },
  ]
  clear: [account: string]
}>()

// 表单数据
const formData = ref({
  coins: [{ name: '', amount: null as number | null }],
  fee: null as number | null,
  remark: '',
})

// 添加币种
const addCoin = () => {
  formData.value.coins.push({ name: '', amount: null as number | null })
}

// 移除币种
const removeCoin = (index: number) => {
  if (formData.value.coins.length > 1) {
    formData.value.coins.splice(index, 1)
  }
}

// 清空数据
const clearData = () => {
  // 重置表单
  formData.value = {
    coins: [{ name: '', amount: null }],
    fee: null,
    remark: '',
  }
  // 触发清空事件
  emit('clear', props.selectedAccount)
  // 关闭弹窗
  closeModal()
}

// 保存数据
const saveData = () => {
  // 过滤掉空的币种
  const validCoins = formData.value.coins.filter(
    (coin): coin is { name: string; amount: number } =>
      coin.name.trim() !== '' && coin.amount !== null && coin.amount > 0,
  )

  // 检查是否至少有一个有效数据（币种、手续费、备注任一不为空）
  const hasFee = formData.value.fee !== null
  const hasRemark = formData.value.remark.trim() !== ''
  const hasValidData = validCoins.length > 0 || hasFee || hasRemark

  if (!hasValidData) {
    window.GlobalPlugin.toast.warning('请至少添加一个有效的数据（币种、手续费或备注）')
    return
  }

  emit('save', {
    account: props.selectedAccount,
    date: props.selectedDate,
    coins: validCoins,
    fee: formData.value.fee || 0,
    remark: formData.value.remark || '',
  })

  closeModal()
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 监听现有数据变化
watch(
  () => props.existingData,
  (newData) => {
    if (newData) {
      formData.value = {
        coins:
          newData.coins && newData.coins.length > 0
            ? JSON.parse(JSON.stringify(newData.coins))
            : [{ name: '', amount: null }],
        fee: newData.fee !== undefined ? newData.fee : null,
        remark: newData.remark || '',
      }
    } else {
      formData.value = {
        coins: [{ name: '', amount: null }],
        fee: null,
        remark: '',
      }
    }
  },
  { immediate: true },
)

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && props.existingData) {
      formData.value = {
        coins:
          props.existingData.coins && props.existingData.coins.length > 0
            ? JSON.parse(JSON.stringify(props.existingData.coins))
            : [{ name: '', amount: null }],
        fee: props.existingData.fee !== undefined ? props.existingData.fee : null,
        remark: props.existingData.remark || '',
      }
    } else if (newVisible) {
      formData.value = {
        coins: [{ name: '', amount: null }],
        fee: null,
        remark: '',
      }
    }
  },
)

// 组件挂载时初始化
onMounted(() => {
  if (props.visible && props.existingData) {
    formData.value = {
      coins:
        props.existingData.coins && props.existingData.coins.length > 0
          ? JSON.parse(JSON.stringify(props.existingData.coins))
          : [{ name: '', amount: null }],
      fee: props.existingData.fee !== undefined ? props.existingData.fee : null,
      remark: props.existingData.remark || '',
    }
  }
})
</script>

<style lang="scss" scoped>
.form-group {
  margin-bottom: 15px;

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

/* 响应式设计 */
@media (max-width: 768px) {
  .airdrop-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
