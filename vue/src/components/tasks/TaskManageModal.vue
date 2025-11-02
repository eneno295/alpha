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
          :class="[
            'template-item',
            { 'pending-delete-item': pendingDeleteIds.includes(template.id) },
          ]"
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
          <button
            class="btn-delete"
            :class="{ 'pending-delete': pendingDeleteIds.includes(template.id) }"
            @click.stop="handleMarkDelete(template.id)"
            :title="pendingDeleteIds.includes(template.id) ? '取消删除' : '删除任务'"
          >
            {{ pendingDeleteIds.includes(template.id) ? '↩️' : '🗑️' }}
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

const { showManageModal, taskData, editingTask, showAddTaskModal, updateTodayRecordDetails } =
  useTaskManagement()
const appStore = useAppStore()
const { withLoading } = useLoading()

// 更新排序（只更新数据，不调用接口）
const handleUpdateOrder = (templates: TaskTemplate[]) => {
  if (!appStore.currentUser || !appStore.currentUser.tasks) return

  // 更新每个模板的 sort 属性
  templates.forEach((template, index) => {
    const originalTemplate = appStore.currentUser!.tasks!.tasks.find((t) => t.id === template.id)
    if (originalTemplate) {
      originalTemplate.sort = index + 1
    }
  })

  // 只更新今天记录的 detail 快照，旧数据保持不变
  updateTodayRecordDetails((task, taskTemplate) => {
    const template = templates.find((t) => t.id === task.taskId)
    if (template) {
      task.detail = { ...template }
    }
  })
}

// 删除任务模板（仅执行删除操作，不调用接口）
const deleteTemplate = (templateId: number) => {
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
}

const localTemplates = ref<TaskTemplate[]>([])
const pendingDeleteIds = ref<number[]>([]) // 待删除的任务ID列表

// 监听弹窗打开时，复制一份数据到本地
watch(
  showManageModal,
  (visible) => {
    if (visible && taskData.value?.tasks) {
      localTemplates.value = [...taskData.value.tasks].sort((a, b) => a.sort - b.sort)
      pendingDeleteIds.value = [] // 重置待删除列表
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
    duration: '连续完成',
    deadline: '到期完成',
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
}

const handleClose = () => {
  showManageModal.value = false
  // 取消时恢复原始数据
  if (taskData.value?.tasks) {
    localTemplates.value = [...taskData.value.tasks].sort((a, b) => a.sort - b.sort)
    pendingDeleteIds.value = [] // 清除待删除标记
  }
}

const handleConfirm = async () => {
  try {
    await withLoading(async () => {
      // 先执行所有待删除的任务（只删除数据，不调用接口）
      if (pendingDeleteIds.value.length > 0) {
        for (const taskId of pendingDeleteIds.value) {
          deleteTemplate(taskId)
        }
      }

      // 然后更新排序（只更新保留的任务）
      const templatesToKeep = localTemplates.value.filter(
        (t) => !pendingDeleteIds.value.includes(t.id),
      )
      handleUpdateOrder(templatesToKeep)

      // 统一调用一次接口保存所有更改（删除和排序）
      await appStore.api.updateData()
    }, '保存中...')

    window.GlobalPlugin.toast.success('操作成功')
    showManageModal.value = false
  } catch (error) {
    console.error('保存失败:', error)
    window.GlobalPlugin.toast.error('保存失败')
  }
}

// 标记/取消标记删除
const handleMarkDelete = (taskId: number) => {
  const index = pendingDeleteIds.value.indexOf(taskId)
  if (index > -1) {
    // 取消删除标记
    pendingDeleteIds.value.splice(index, 1)
  } else {
    // 添加删除标记
    pendingDeleteIds.value.push(taskId)
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

      &.pending-delete-item {
        opacity: 0.5;
        filter: grayscale(70%);
        background: rgba(239, 68, 68, 0.05) !important;
        border: 1px dashed #ef4444;
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

          &.duration {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }

          &.deadline {
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

        &.pending-delete {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);

          &:hover {
            background: rgba(16, 185, 129, 0.2);
          }
        }
      }
    }
  }
}
</style>
