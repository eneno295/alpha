<template>
  <BaseModal
    :visible="showAddTaskModal"
    :title="isReadonly ? '任务详情' : editingTask ? '编辑任务' : '添加任务'"
    size="medium"
    :show-footer="!isReadonly"
    @close="closeAddTaskModal"
    @confirm="handleSave"
  >
    <form @submit.prevent="handleSave" class="task-form">
      <div class="form-group">
        <label>分类 *</label>
        <select v-model="formData.category" :disabled="isReadonly" required>
          <option value="daily">每日任务</option>
          <option value="weekly">每周任务</option>
          <option value="monthly">每月任务</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div class="form-group">
        <label>任务标题 *</label>
        <input
          v-model="formData.title"
          type="text"
          placeholder="输入任务标题"
          :disabled="isReadonly"
          required
        />
      </div>

      <div class="form-group">
        <label>任务描述</label>
        <textarea
          v-model="formData.description"
          placeholder="输入任务描述（可选）"
          :disabled="isReadonly"
          rows="3"
        ></textarea>
      </div>

      <!-- 自定义任务的时间配置 -->
      <template v-if="formData.category === 'custom'">
        <div class="form-group">
          <label>任务时间类型</label>
          <select v-model="formData.taskDurationType" :disabled="isReadonly">
            <option value="deadline">到期天数（几天后完成）</option>
            <option value="duration">持续天数（连续几天需要完成）</option>
          </select>
        </div>

        <div class="form-group">
          <label>天数 *</label>
          <input
            v-model.number="formData.taskDays"
            type="number"
            min="1"
            placeholder="输入天数"
            :disabled="isReadonly"
            required
          />
        </div>
      </template>

      <div class="form-group">
        <label>卡片颜色</label>
        <div class="color-picker">
          <div
            v-for="color in colorOptions"
            :key="color.value"
            :class="[
              'color-option',
              { selected: formData.bgColor === color.value, disabled: isReadonly },
            ]"
            :style="{ background: color.gradient }"
            @click="!isReadonly && (formData.bgColor = color.value)"
            :title="color.name"
          >
            <span v-if="formData.bgColor === color.value" class="check-icon">✓</span>
          </div>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTaskManagement } from '@/composables/useTaskManagement'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import type { TaskTemplate } from '@/types/task'

const { showAddTaskModal, editingTask, taskData, isReadonly } = useTaskManagement()
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

// 关闭弹窗（直接在组件中实现）
const closeAddTaskModal = () => {
  showAddTaskModal.value = false
  editingTask.value = null
  isReadonly.value = false
}

// 初始化任务数据（辅助函数）
const initTaskData = () => {
  if (!appStore.currentUser) return
  if (!appStore.currentUser.tasks) {
    appStore.currentUser.tasks = {
      config: {},
      tasks: [],
      date: [],
    }
  }
  if (!appStore.currentUser.tasks.config) {
    appStore.currentUser.tasks.config = {}
  }
}

// 添加任务模板（直接在组件中实现）
const addTemplate = async (template: TaskTemplate) => {
  if (!appStore.currentUser) throw new Error('用户不存在')

  initTaskData()

  appStore.currentUser.tasks!.tasks.push(template)
  await appStore.api.updateData()
}

// 更新任务模板（直接在组件中实现）
const updateTemplate = async (templateId: number, updates: Partial<TaskTemplate>) => {
  if (!appStore.currentUser || !appStore.currentUser.tasks) throw new Error('任务数据不存在')

  const template = appStore.currentUser.tasks.tasks.find((t) => t.id === templateId)
  if (template) {
    Object.assign(template, updates)

    // 更新所有日期记录中的 detail 快照
    appStore.currentUser.tasks.date.forEach((record) => {
      record.tasks.forEach((task) => {
        if (task.taskId === templateId) {
          task.detail = { ...template }
        }
      })
    })

    await appStore.api.updateData()
  }
}

// 保存任务（直接在组件中实现）
const handleSaveTask = async (formData: {
  title: string
  description: string
  category: string
  bgColor: string
  taskDurationType?: 'deadline' | 'duration'
  taskDays?: number
}) => {
  if (!taskData.value) return

  const isEditing = !!editingTask.value

  try {
    await withLoading(
      async () => {
        if (editingTask.value) {
          const updates: any = {
            title: formData.title,
            description: formData.description,
            category: formData.category as any,
            bgColor: formData.bgColor,
          }
          // 只有自定义任务才保存时间配置
          if (formData.category === 'custom') {
            updates.taskDurationType = formData.taskDurationType
            updates.taskDays = formData.taskDays
            // 如果是新任务或开始日期未设置，设置开始日期为今天
            if (!editingTask.value.startDate) {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              updates.startDate = today.getTime()
            }
          } else {
            // 非自定义任务，清除时间配置
            updates.taskDurationType = undefined
            updates.taskDays = undefined
            updates.startDate = undefined
          }
          await updateTemplate(editingTask.value.id, updates)
        } else {
          initTaskData()

          const maxId =
            taskData.value.tasks && taskData.value.tasks.length > 0
              ? Math.max(...taskData.value.tasks.map((t) => t.id))
              : 0
          const maxSort =
            taskData.value.tasks && taskData.value.tasks.length > 0
              ? Math.max(...taskData.value.tasks.map((t) => t.sort))
              : 0

          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const newTemplate: any = {
            id: maxId + 1,
            title: formData.title,
            description: formData.description,
            category: formData.category as any,
            sort: maxSort + 1,
            bgColor: formData.bgColor,
          }
          // 只有自定义任务才添加时间配置
          if (formData.category === 'custom') {
            newTemplate.taskDurationType = formData.taskDurationType
            newTemplate.taskDays = formData.taskDays
            newTemplate.startDate = today.getTime()
          }

          await addTemplate(newTemplate)

          const todayRecord = getTodayRecord()
          if (todayRecord && appStore.currentUser?.tasks) {
            todayRecord.tasks.push({
              taskId: newTemplate.id,
              detail: { ...newTemplate },
            })
            await appStore.api.updateData()
          }
        }
      },
      isEditing ? '更新任务中...' : '添加任务中...',
    )

    closeAddTaskModal()
    window.GlobalPlugin.toast.success(isEditing ? '任务已更新' : '任务已添加')
  } catch (error) {
    console.error('保存任务失败:', error)
    window.GlobalPlugin.toast.error('保存任务失败')
  }
}

// 颜色选项
const colorOptions = [
  {
    value: 'default',
    name: '默认白色',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  },
  { value: 'blue', name: '清新蓝', gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' },
  {
    value: 'purple',
    name: '优雅紫',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
  },
  { value: 'pink', name: '浪漫粉', gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' },
  { value: 'green', name: '活力绿', gradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' },
  {
    value: 'yellow',
    name: '温暖黄',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
  },
  {
    value: 'orange',
    name: '活力橙',
    gradient: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
  },
  { value: 'gray', name: '简约灰', gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' },
]

const formData = ref({
  title: '',
  description: '',
  category: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
  bgColor: 'default',
  taskDurationType: 'deadline' as 'deadline' | 'duration' | undefined,
  taskDays: undefined as number | undefined,
})

// 监听编辑任务变化
watch(
  editingTask,
  (task) => {
    if (task) {
      formData.value = {
        title: task.title,
        description: task.description || '',
        category: task.category,
        bgColor: task.bgColor || 'default',
        taskDurationType: task.taskDurationType || 'deadline',
        taskDays: task.taskDays,
      }
    } else {
      formData.value = {
        title: '',
        description: '',
        category: 'daily',
        bgColor: 'default',
        taskDurationType: 'deadline',
        taskDays: undefined,
      }
    }
  },
  { immediate: true },
)

// 监听分类变化，如果不是自定义任务，清空时间配置
watch(
  () => formData.value.category,
  (newCategory) => {
    if (newCategory !== 'custom') {
      formData.value.taskDurationType = 'deadline'
      formData.value.taskDays = undefined
    }
  },
)

// 监听弹窗关闭，确保清空表单
watch(showAddTaskModal, (isVisible) => {
  if (!isVisible) {
    // 弹窗关闭时清空表单和只读状态
    formData.value = {
      title: '',
      description: '',
      category: 'daily',
      bgColor: 'default',
      taskDurationType: 'deadline',
      taskDays: undefined,
    }
    isReadonly.value = false
  }
})

const handleSave = () => {
  if (!formData.value.title.trim()) {
    window.GlobalPlugin.toast.warning('请输入任务标题')
    return
  }
  // 自定义任务必须填写天数
  if (formData.value.category === 'custom') {
    if (!formData.value.taskDays || formData.value.taskDays < 1) {
      window.GlobalPlugin.toast.warning('请输入天数（必须大于0）')
      return
    }
  }
  handleSaveTask(formData.value)
}
</script>

<style lang="scss" scoped>
.task-form {
  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    textarea {
      resize: vertical;
      min-height: 80px;
    }

    .color-picker {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .color-option {
        height: 50px;
        border-radius: 10px;
        cursor: pointer;
        border: 3px solid transparent;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

        &:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.selected {
          border-color: #667eea;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
          transform: scale(1.05);
        }

        &.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .check-icon {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}
</style>
