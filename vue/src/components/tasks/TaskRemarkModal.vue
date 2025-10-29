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
import BaseModal from '@/components/common/BaseModal.vue'

const { showRemarkModal, currentTask, closeRemarkModal, handleSaveRemark } = useTaskManagement()

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
