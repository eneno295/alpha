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
          <option value="daily">每日</option>
          <option value="duration">连续完成</option>
          <option value="deadline">到期完成</option>
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

      <!-- 时间配置（仅限连续完成和到期完成） -->
      <template v-if="formData.category === 'duration'">
        <div class="form-group">
          <label>任务时间 *</label>
          <Datepicker
            :model-value="formData.dateRange as any"
            @update:model-value="handleDateRangeChange"
            :disabled="isReadonly"
            :enable-time-picker="false"
            format="yyyy/MM/dd"
            range
            auto-apply
            :teleport="true"
            placeholder="选择开始日期 - 结束日期"
          />
        </div>
      </template>
      <template v-if="formData.category === 'deadline'">
        <div class="form-group">
          <label>到期日期 *</label>
          <Datepicker
            :model-value="formData.deadlineDate"
            @update:model-value="formData.deadlineDate = $event as Date | null"
            :disabled="isReadonly"
            :enable-time-picker="false"
            format="yyyy/MM/dd"
            auto-apply
            :teleport="true"
            placeholder="选择到期日期"
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
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const { showAddTaskModal, editingTask, taskData, isReadonly, updateTodayRecordDetails } =
  useTaskManagement()
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

    // 只更新今天记录的 detail 快照，旧数据保持不变
    updateTodayRecordDetails((task, taskTemplate) => {
      if (task.taskId === templateId) {
        task.detail = { ...taskTemplate }
      }
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
  startDate?: Date | null
  endDate?: Date | null
  deadlineDate?: Date | null
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
          // 只有连续完成和到期完成才保存时间配置
          if (formData.category === 'duration') {
            updates.startDate = dateToTimestamp(formData.startDate ?? null)
            updates.endDate = dateToTimestamp(formData.endDate ?? null)
            updates.deadlineDate = undefined
          } else if (formData.category === 'deadline') {
            // deadline 类型，使用 deadlineDate，startDate 设置为到期日期（用于兼容逻辑）
            const deadlineTimestamp = dateToTimestamp(formData.deadlineDate ?? null)
            updates.deadlineDate = deadlineTimestamp
            updates.startDate = deadlineTimestamp // 兼容逻辑：deadline 的 startDate 就是到期日期
            updates.endDate = undefined
          } else {
            // 每日任务，清除时间配置
            updates.startDate = undefined
            updates.endDate = undefined
            updates.deadlineDate = undefined
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
          // 只有连续完成和到期完成才添加时间配置
          if (formData.category === 'duration') {
            newTemplate.startDate = dateToTimestamp(formData.startDate ?? null)
            newTemplate.endDate = dateToTimestamp(formData.endDate ?? null)
          } else if (formData.category === 'deadline') {
            // deadline 类型，使用 deadlineDate，startDate 设置为到期日期（用于兼容逻辑）
            const deadlineTimestamp = dateToTimestamp(formData.deadlineDate ?? null)
            newTemplate.deadlineDate = deadlineTimestamp
            newTemplate.startDate = deadlineTimestamp // 兼容逻辑：deadline 的 startDate 就是到期日期
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

// 将时间戳转换为 Date 对象
const timestampToDate = (timestamp?: number): Date | null => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date
}

// 将 Date 对象转换为时间戳（当天0点）
const dateToTimestamp = (date: Date | null): number => {
  if (!date) return 0
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// 获取今天的 Date 对象
const getTodayDate = (): Date => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const formData = ref({
  title: '',
  description: '',
  category: 'daily' as 'daily' | 'duration' | 'deadline',
  bgColor: 'default',
  dateRange: null as [Date | null, Date | null] | null, // 日期范围（开始日期 - 结束日期，仅限 duration）
  startDate: null as Date | null, // 开始日期（兼容字段）
  endDate: null as Date | null, // 结束日期（兼容字段）
  deadlineDate: null as Date | null, // 到期日期（仅限 deadline）
})

// 处理日期范围变化
const handleDateRangeChange = (value: any) => {
  if (Array.isArray(value) && value.length === 2) {
    formData.value.startDate = value[0] as Date | null
    formData.value.endDate = value[1] as Date | null
    formData.value.dateRange = [value[0] as Date | null, value[1] as Date | null]
  } else {
    formData.value.startDate = null
    formData.value.endDate = null
    formData.value.dateRange = null
  }
}

// 初始化日期默认值
const initDateDefaults = () => {
  const today = getTodayDate()
  if (formData.value.category === 'duration') {
    if (!formData.value.dateRange) {
      const todayDate = new Date(today)
      formData.value.dateRange = [todayDate, todayDate]
      formData.value.startDate = todayDate
      formData.value.endDate = todayDate
    }
  } else if (formData.value.category === 'deadline') {
    if (!formData.value.deadlineDate) {
      formData.value.deadlineDate = new Date(today)
    }
  }
}

// 监听编辑任务变化
watch(
  editingTask,
  (task) => {
    if (task) {
      const startDate = timestampToDate(task.startDate)
      const endDate = timestampToDate(task.endDate)
      formData.value = {
        title: task.title,
        description: task.description || '',
        category: task.category,
        bgColor: task.bgColor || 'default',
        dateRange: startDate && endDate ? [startDate, endDate] : null,
        startDate: startDate,
        endDate: endDate,
        deadlineDate: timestampToDate(task.deadlineDate),
      }
    } else {
      formData.value = {
        title: '',
        description: '',
        category: 'daily',
        bgColor: 'default',
        dateRange: null,
        startDate: null,
        endDate: null,
        deadlineDate: null,
      }
      // 如果是新建任务，初始化日期默认值
      initDateDefaults()
    }
  },
  { immediate: true },
)

// 监听分类变化，设置或清空时间配置
watch(
  () => formData.value.category,
  (newCategory) => {
    if (newCategory === 'daily') {
      formData.value.dateRange = null
      formData.value.startDate = null
      formData.value.endDate = null
      formData.value.deadlineDate = null
    } else {
      // 切换到连续完成或到期完成时，如果没有日期则默认今天
      initDateDefaults()
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
      dateRange: null,
      startDate: null,
      endDate: null,
      deadlineDate: null,
    }
    isReadonly.value = false
  } else {
    // 弹窗打开时，如果是新建任务（没有编辑任务），初始化日期默认值
    if (!editingTask.value) {
      initDateDefaults()
    }
  }
})

const handleSave = () => {
  if (!formData.value.title.trim()) {
    window.GlobalPlugin.toast.warning('请输入任务标题')
    return
  }
  // 连续完成必须填写日期范围
  if (formData.value.category === 'duration') {
    if (!formData.value.dateRange || !formData.value.dateRange[0] || !formData.value.dateRange[1]) {
      window.GlobalPlugin.toast.warning('请选择日期范围')
      return
    }
    if (formData.value.dateRange[1]! < formData.value.dateRange[0]!) {
      window.GlobalPlugin.toast.warning('结束日期不能早于开始日期')
      return
    }
  }
  // 到期完成必须填写到期日期
  if (formData.value.category === 'deadline') {
    if (!formData.value.deadlineDate) {
      window.GlobalPlugin.toast.warning('请选择到期日期')
      return
    }
  }
  handleSaveTask(formData.value)
}
</script>

<style lang="scss" scoped>
.task-form {
  .form-group {
    margin-bottom: 15px;

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
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    // 日期选择器样式
    :deep(.dp__input_wrap) {
      width: 100%;
    }

    :deep(.dp__input) {
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

      &:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    // 隐藏日期选择器的 SVG 图标
    :deep(.dp__input_icon) {
      display: none !important;
    }

    :deep(.dp__input_icons) {
      display: none !important;
    }

    :deep(svg.dp__input_icon) {
      display: none !important;
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
