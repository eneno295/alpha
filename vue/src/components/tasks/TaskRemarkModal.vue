<template>
  <BaseModal
    :visible="showRemarkModal"
    :title="currentTask?.detail?.title || '任务备注'"
    size="medium"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <div class="remark-form">
      <div class="form-group">
        <label>备注内容</label>
        <textarea
          v-model="localRemark"
          placeholder="请输入备注内容（可选）"
          rows="4"
          autofocus
        ></textarea>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTaskManagement } from '@/composables/useTaskManagement'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import BaseModal from '@/components/common/BaseModal.vue'

const { showRemarkModal, currentTask, taskData } = useTaskManagement()
const appStore = useAppStore()
const { withLoading } = useLoading()

// 获取今天的记录（辅助函数）
const getTodayRecord = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()
  const todayKey = Math.floor(todayTimestamp / (24 * 60 * 60 * 1000))
  if (!taskData.value || !taskData.value.date) return undefined
  return taskData.value.date.find(
    (record) => Math.floor(record.date / (24 * 60 * 60 * 1000)) === todayKey,
  )
}

// 关闭备注弹窗（直接在组件中实现）
const closeRemarkModal = () => {
  showRemarkModal.value = false
  currentTask.value = null
}

// 保存备注（直接在组件中实现）
const handleSaveRemark = async (remark: string) => {
  if (!currentTask.value) return

  try {
    await withLoading(async () => {
      const todayRecord = getTodayRecord()
      if (todayRecord) {
        await appStore.tasks.updateTaskCompletion(
          todayRecord.id,
          currentTask.value.taskId,
          currentTask.value.completedAt, // 保持原有的完成时间
          remark.trim() || undefined, // 如果备注为空则删除
        )
      }
    }, '保存备注中...')

    closeRemarkModal()
    window.GlobalPlugin.toast.success(remark.trim() ? '备注已保存' : '备注已清除')
  } catch (error) {
    console.error('保存备注失败:', error)
    window.GlobalPlugin.toast.error('保存备注失败')
  }
}

const localRemark = ref('')

watch(
  showRemarkModal,
  (visible) => {
    if (visible && currentTask.value) {
      localRemark.value = currentTask.value.remark || ''
    }
  },
  { immediate: true },
)

const handleClose = () => {
  closeRemarkModal()
}

const handleConfirm = () => {
  handleSaveRemark(localRemark.value)
}
</script>

<style lang="scss" scoped>
.remark-form {
  .form-group {
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 1rem;
      resize: vertical;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: var(--text-secondary);
      }
    }
  }
}
</style>
