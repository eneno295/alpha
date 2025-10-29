<template>
  <BaseModal
    :visible="showManageModal"
    title="管理任务模板"
    size="medium"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <div class="manage-content">
      <p class="manage-hint">拖拽任务可以调整排序</p>
      <div class="template-list">
        <div
          v-for="(template, index) in sortedTemplates"
          :key="template.id"
          class="template-item"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent="handleDragOver(index)"
          @drop="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <div class="drag-handle">
            <span class="icon">☰</span>
          </div>
          <div class="template-info" @click="handleEdit(template)">
            <h4>{{ template.title }}</h4>
            <span :class="['category-badge', template.category]">{{
              getCategoryLabel(template.category)
            }}</span>
          </div>
          <button class="btn-delete" @click.stop="handleDelete(template.id)" title="删除任务">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTaskManagement } from '@/composables/useTaskManagement'
import type { TaskTemplate } from '@/types'

const {
  showManageModal,
  taskData,
  handleUpdateOrder,
  handleDeleteTask,
  editingTask,
  showAddTaskModal,
} = useTaskManagement()

const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)
const localTemplates = ref<TaskTemplate[]>([])

// 监听弹窗打开时，复制一份数据到本地
watch(
  showManageModal,
  (visible) => {
    if (visible && taskData.value?.tasks) {
      localTemplates.value = [...taskData.value.tasks].sort((a, b) => a.sort - b.sort)
    }
  },
  { immediate: true },
)

const sortedTemplates = computed(() => {
  return localTemplates.value
})

const getCategoryLabel = (category: string) => {
  const labels = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月',
    custom: '自定义',
  }
  return labels[category as keyof typeof labels] || category
}

const handleDragStart = (index: number) => {
  dragIndex.value = index
}

const handleDragOver = (index: number) => {
  dropIndex.value = index
}

const handleDrop = (index: number) => {
  if (dragIndex.value === null || dragIndex.value === index) return

  const templates = [...localTemplates.value]
  const [draggedItem] = templates.splice(dragIndex.value, 1)
  templates.splice(index, 0, draggedItem)

  // 更新所有模板的 sort 值
  templates.forEach((template, idx) => {
    template.sort = idx + 1
  })

  // 只更新本地数据，不发送请求
  localTemplates.value = templates

  dragIndex.value = null
  dropIndex.value = null
}

const handleDragEnd = () => {
  dragIndex.value = null
  dropIndex.value = null
}

const handleEdit = (template: any) => {
  editingTask.value = template
  showAddTaskModal.value = true
  showManageModal.value = false // 关闭管理弹窗，让编辑弹窗显示在前面
}

const handleClose = () => {
  showManageModal.value = false
  // 取消时恢复原始数据
  if (taskData.value?.tasks) {
    localTemplates.value = [...taskData.value.tasks].sort((a, b) => a.sort - b.sort)
  }
}

const handleConfirm = async () => {
  // 确认时才发送请求
  await handleUpdateOrder(localTemplates.value)
  showManageModal.value = false
}

const handleDelete = async (taskId: number) => {
  await handleDeleteTask(taskId)
  // 删除成功后更新本地列表
  if (taskData.value?.tasks) {
    localTemplates.value = [...taskData.value.tasks].sort((a, b) => a.sort - b.sort)
  }
}
</script>

<style lang="scss" scoped>
.manage-content {
  .manage-hint {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 16px;
    text-align: center;
  }

  .template-list {
    max-height: 500px;
    overflow-y: auto;

    .template-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin-bottom: 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: move;
      transition: all 0.2s ease;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
      }

      .drag-handle {
        font-size: 1.2rem;
        color: var(--text-secondary);
        cursor: grab;

        &:active {
          cursor: grabbing;
        }
      }

      .template-info {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;

        h4 {
          margin: 0;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .category-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;

          &.daily {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
          }

          &.weekly {
            background: rgba(249, 115, 22, 0.1);
            color: #f97316;
          }

          &.monthly {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }

          &.custom {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
          }
        }
      }

      .btn-delete {
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: #ef4444;
        font-size: 1.2rem;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
}
</style>
