<template>
  <!-- 添加记录弹出框 -->
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdit ? '修改' : '新建' }} {{ formatDateForTitle(selectedDate) }} 的记录</h3>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="form-section">
          <div class="score-row">
            <div class="form-group">
              <label>当前积分</label>
              <input v-model="formData.curScore" type="number" placeholder="0" />
            </div>
            <div class="form-group">
              <label>今日刷的积分</label>
              <input v-model="formData.todayScore" type="number" placeholder="0" />
            </div>
          </div>
          <div class="form-group">
            <label>消耗积分</label>
            <input v-model="formData.ConsumptionScore" type="number" placeholder="0" />
          </div>
          <div class="form-group">
            <label>手续费</label>
            <input v-model="formData.fee" type="number" step="0.01" placeholder="0.00" />
          </div>
        </div>

        <!-- 空投信息 -->
        <div class="form-section">
          <label>空投信息</label>
          <div class="airdrop-container">
            <div class="airdrop-list">
              <div v-for="(airdrop, index) in formData.airdrops" :key="index" class="airdrop-item">
                <input
                  v-model="airdrop.coin"
                  type="text"
                  placeholder="输入空投名称"
                  class="airdrop-name"
                />
                <input
                  v-model="airdrop.amount"
                  type="number"
                  step="0.01"
                  placeholder="收入"
                  class="airdrop-income"
                />
                <button class="remove-airdrop" @click="removeAirdrop(index)" type="button">
                  ×
                </button>
              </div>
            </div>
            <button class="add-airdrop-btn" @click="addAirdrop" type="button">
              <span>+</span> 添加空投
            </button>
          </div>
        </div>

        <!-- 备注 -->
        <div class="form-section lineBreak-group">
          <label>备注</label>
          <textarea v-model="formData.remark" placeholder="添加备注信息" rows="3"></textarea>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-footer">
          <div class="footer-left">
            <button class="btn-clear" @click="clearForm" type="button">清空</button>
          </div>
          <div class="footer-right">
            <button class="btn-cancel" @click="closeModal" type="button">取消</button>
            <button class="btn-save" @click="saveRecord" type="button">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import type { DateRecord } from '@/types'

const props = defineProps<{
  show: boolean
  selectedDate: string
  existingRecord?: DateRecord
}>()

const emit = defineEmits<{
  close: []
  save: [record: DateRecord]
}>()

const store = useAppStore()

// 格式化日期為標題格式 (YYYY-MM-DD)
const formatDateForTitle = (dateString: string) => {
  return dateString
}

// 重置表單
const resetForm = () => {
  formData.value = {
    curScore: 0,
    todayScore: 0,
    ConsumptionScore: 0,
    fee: 0,
    airdrops: [{ coin: '', amount: 0 }],
    remark: '',
  }
}

// 判斷是否為編輯模式
const isEdit = computed(() => !!props.existingRecord)

// 表單數據
const formData = ref({
  curScore: 0,
  todayScore: 0,
  ConsumptionScore: 0,
  fee: 0,
  airdrops: [{ coin: '', amount: 0 }],
  remark: '',
})

// 監聽現有記錄，初始化表單
watch(
  () => props.existingRecord,
  (record) => {
    if (record) {
      // 處理多個空投信息
      let airdrops = []
      if (record.coin && (record.amount || 0) > 0) {
        // 檢查是否有 _allAirdrops 字段（包含所有空投信息）
        if ((record as any)._allAirdrops && (record as any)._allAirdrops.length > 0) {
          airdrops = (record as any)._allAirdrops
        } else {
          // 單個空投的情況
          airdrops = [{ coin: record.coin, amount: record.amount || 0 }]
        }
      } else {
        airdrops = [{ coin: '', amount: 0 }]
      }

      formData.value = {
        curScore: record.curScore || 0,
        todayScore: record.todayScore || 0,
        ConsumptionScore: record.ConsumptionScore || 0,
        fee: record.fee || 0,
        airdrops: airdrops,
        remark: '',
      }
    } else {
      // 新建模式，重置表單
      resetForm()
    }
  },
  { immediate: true },
)

// 添加空投
const addAirdrop = () => {
  formData.value.airdrops.push({ coin: '', amount: 0 })
}

// 移除空投
const removeAirdrop = (index: number) => {
  if (formData.value.airdrops.length > 1) {
    formData.value.airdrops.splice(index, 1)
  }
}

// 清空表單
const clearForm = () => {
  resetForm()
}

// 關閉模態框
const closeModal = () => {
  emit('close')
}

// 保存記錄
const saveRecord = () => {
  // 檢查是否所有字段都為空
  const allFieldsEmpty =
    formData.value.airdrops.every((airdrop) => !airdrop.coin && airdrop.amount === 0) &&
    formData.value.fee === 0 &&
    formData.value.curScore === 0 &&
    formData.value.todayScore === 0 &&
    !formData.value.remark

  if (allFieldsEmpty) {
    // 清空該日期的數據
    emit('save', {
      date: props.selectedDate,
      coin: '',
      amount: 0,
      fee: 0,
      curScore: 0,
      todayScore: 0,
      ConsumptionScore: 0,
      _isDelete: true, // 標記為刪除操作
    } as DateRecord & { _isDelete: boolean })
    closeModal()
    return
  }

  // 收集所有記錄
  const allRecords: DateRecord[] = []

  // 為每個空投創建記錄（包括沒有收益的）
  formData.value.airdrops.forEach((airdrop) => {
    const record: DateRecord = {
      date: props.selectedDate,
      coin: airdrop.coin,
      amount: airdrop.amount,
      fee: formData.value.fee,
      curScore: formData.value.curScore,
      todayScore: formData.value.todayScore,
      ConsumptionScore: formData.value.ConsumptionScore,
    }

    allRecords.push(record)
  })

  // 一次性發送所有記錄
  emit('save', allRecords)
  closeModal()
}
</script>

<style scoped>
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
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem 1.5rem 0.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-section label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.score-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.score-row .form-group {
  flex: 1;
  min-width: 120px;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label,
.lineBreak-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.lineBreak-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.lineBreak-group textarea:focus,
.airdrop-name:focus,
.airdrop-income:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea,
.lineBreak-group textarea {
  resize: vertical;
  min-height: 80px;
}

.airdrop-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--bg-secondary);
  width: 100%;
  box-sizing: border-box;
}

.airdrop-list {
  margin-bottom: 1rem;
}

.airdrop-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.airdrop-name {
  flex: 2;
  margin: 0 !important;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.airdrop-income {
  flex: 1;
  margin: 0 !important;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.airdrop-item:last-child {
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
  font-size: 1rem;
  transition: all 0.2s ease;
}

.remove-airdrop:hover {
  background: #dc2626;
  transform: scale(1.1);
  font-size: 1.2rem;
}

.add-airdrop-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.add-airdrop-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.add-airdrop-btn span {
  font-size: 1.2rem;
  font-weight: bold;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.footer-left {
  display: flex;
}

.footer-right {
  display: flex;
  gap: 1rem;
}

.btn-cancel,
.btn-clear,
.btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-cancel {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--bg-secondary);
}

.btn-clear {
  background: var(--warning);
  color: white;
}

.btn-clear:hover {
  background: #d97706;
}

.btn-save {
  background: var(--primary);
  color: white;
}

.btn-save:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-width: 95%;
    margin: 10px;
  }

  .score-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .score-row .form-group {
    margin-bottom: 0.75rem;
    min-width: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .score-row .form-group label {
    margin-bottom: 0;
    min-width: 80px;
    font-size: 0.8rem;
  }

  .score-row .form-group input {
    flex: 1;
  }

  .form-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-group label {
    margin-bottom: 0;
    min-width: 80px;
    font-size: 0.8rem;
  }

  .form-group input,
  .form-group textarea {
    flex: 1;
  }

  .form-group textarea {
    min-height: 60px;
  }

  /* 空投信息和备注字段保持垂直布局 */
  .lineBreak-group {
    display: block;
  }

  .lineBreak-group label {
    display: block;
    margin-bottom: 0.5rem;
    min-width: auto;
    color: var(--text-primary);
    font-weight: 500;
    font-size: 0.9rem;
  }

  .lineBreak-group textarea {
    min-height: 60px;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .airdrop-container {
    margin-top: 0.5rem;
  }

  .airdrop-item {
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
  }

  .airdrop-name {
    flex: 2;
  }

  .airdrop-income {
    flex: 1;
  }

  .remove-airdrop {
    flex-shrink: 0;
  }

  .add-airdrop-btn {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 98%;
    max-width: 98%;
    margin: 5px;
  }

  .nav-tabs {
    flex-direction: column;
    gap: 0.25rem;
  }

  .tab-btn {
    width: 100%;
  }

  .airdrop-item {
    gap: 0.25rem;
    flex-direction: row;
    align-items: center;
  }

  .airdrop-name {
    flex: 2;
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .airdrop-income {
    flex: 1;
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .remove-airdrop {
    width: 22px;
    height: 22px;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
}
</style>
