<template>
  <BaseModal
    :visible="showManageModal"
    title="管理任务模板"
    size="medium"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <div class="manage-content">
      <div class="template-list">
        <div
          v-for="(template, index) in sortedTemplates"
          :key="template.id"
          class="template-item"
          :style="getItemStyle(template)"
        >
          <div class="template-info" @click="handleEdit(template)">
            <div class="title-group">
              <div class="texts">
                <h4>{{ template.title }}</h4>
                <p v-if="template.description" class="desc">{{ template.description }}</p>
              </div>
            </div>
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
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import type { TaskTemplate } from '@/types/task'

const { showManageModal, taskData, editingTask, showAddTaskModal } = useTaskManagement()
const appStore = useAppStore()
const { withLoading } = useLoading()

// 更新排序（直接在组件中实现）
const handleUpdateOrder = async (templates: TaskTemplate[]) => {
  try {
    if (taskData.value && taskData.value.date) {
      taskData.value.date.forEach((record) => {
        record.tasks.forEach((task) => {
          const template = templates.find((t) => t.id === task.taskId)
          if (template) {
            task.detail = { ...template }
          }
        })
      })
    }

    await appStore.api.updateData()
    // 不显示成功提示，静默更新
  } catch (error) {
    console.error('更新排序失败:', error)
    window.GlobalPlugin.toast.error('更新排序失败')
  }
}

// 删除任务模板（直接在组件中实现）
const deleteTemplate = async (templateId: number) => {
  if (!appStore.currentUser || !appStore.currentUser.tasks) throw new Error('任务数据不存在')

  // 删除模板
  appStore.currentUser.tasks.tasks = appStore.currentUser.tasks.tasks.filter(
    (t) => t.id !== templateId,
  )

  // 获取今天0点的时间戳
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  // 只删除今天及未来日期记录中的相关任务，保留历史记录
  appStore.currentUser.tasks.date.forEach((record) => {
    if (record.date >= todayTimestamp) {
      // 今天及未来的记录：删除该任务
      record.tasks = record.tasks.filter((t) => t.taskId !== templateId)
    }
    // 历史记录：保留
  })

  await appStore.api.updateData()
}

// 删除任务（直接在组件中实现）
const handleDeleteTask = async (taskId: number) => {
  if (!confirm('确定要删除这个任务模板吗？\n\n将删除模板及今天和未来的任务，历史记录会保留。'))
    return

  try {
    await withLoading(async () => {
      await deleteTemplate(taskId)
    }, '删除任务中...')

    window.GlobalPlugin.toast.success('任务模板已删除')
  } catch (error) {
    console.error('删除任务失败:', error)
    window.GlobalPlugin.toast.error('删除任务失败')
  }
}

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

// 颜色映射（与 TaskList 保持一致）
const colorGradients: Record<string, string> = {
  default: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  blue: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
  purple: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
  pink: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
  green: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
  yellow: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
  orange: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
  gray: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
}

const getGradient = (bgColor?: string) => colorGradients[bgColor || 'default']

const getItemStyle = (template: TaskTemplate) => {
  return {
    background: getGradient(template.bgColor),
  }
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
  .template-list {
    max-height: 500px;
    overflow-y: auto;

    .template-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin-bottom: 12px;
      background: var(--bg-secondary); // 将被内联样式覆盖为渐变
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
      }

      .template-info {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;

        .title-group {
          display: flex;
          align-items: center;
          gap: 10px;

          .texts {
            display: flex;
            flex-direction: column;
            gap: 4px;

            h4 {
              margin: 0;
              font-size: 1rem;
              color: var(--text-primary);
            }

            .desc {
              margin: 0;
              font-size: 0.85rem;
              color: var(--text-secondary);
              line-height: 1.3;
              max-width: 420px;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
          }
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
