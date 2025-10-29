<template>
  <div class="action-bar">
    <button class="btn-primary" @click="showAddTaskModal = true">
      <span class="icon">➕</span>
      添加任务
    </button>
    <button class="btn-secondary" @click="showManageModal = true">
      <span class="icon">⚙️</span>
      管理模板
    </button>
    <button class="btn-secondary" @click="showHistoryModal = true">
      <span class="icon">📊</span>
      历史记录
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTaskManagement } from '@/composables/useTaskManagement'

const { showAddTaskModal, showManageModal, showHistoryModal } = useTaskManagement()
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
  justify-content: center;

  button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .icon {
      font-size: 18px;
    }

    &.btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
      }

      &:active {
        transform: translateY(0);
      }
    }

    &.btn-secondary {
      background: white;
      color: var(--text-primary);
      border: 2px solid transparent;

      &:hover {
        background: var(--bg-secondary);
        border-color: #667eea;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

@media (max-width: 768px) {
  .action-bar {
    flex-wrap: wrap;
    gap: 12px;

    button {
      flex: 1 1 auto;
      min-width: 140px;
      padding: 12px 20px;
      font-size: 0.95rem;
    }
  }
}
</style>
