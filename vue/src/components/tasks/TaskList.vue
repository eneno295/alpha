<template>
  <div class="task-list">
    <div
      v-for="(task, index) in localTasks"
      :key="task.taskId"
      :class="['task-card', { completed: isCompleted(task), 'not-due': !isTaskDue(task) }]"
      :style="getCardStyle(task)"
      @click="handleCardClick(task)"
      :draggable="isTaskDue(task)"
      @dragstart="onDragStart(index, task)"
      @dragover.prevent="onDragOver(index)"
      @drop="onDrop(localTasks, index)"
      @dragend="onDragEnd"
      @touchstart="(e) => onTouchStart(index, task, e)"
      @touchmove.prevent="(e) => isTaskDue(task) && onTouchMove(e, getCardIndex)"
      @touchend="(e) => isTaskDue(task) && onTouchEnd(localTasks, task, index, e)"
    >
      <div class="task-content">
        <div class="task-header">
          <h3 class="task-title">{{ task.detail.title }}</h3>
          <div class="task-meta">
            <span :class="['category-badge', task.detail.category]">{{
              getCategoryLabel(task.detail.category)
            }}</span>
            <button
              v-if="isCompleted(task)"
              class="btn-remark-icon"
              @click.stop="handleRemark(task)"
              title="添加/修改备注"
            >
              📝
            </button>
          </div>
        </div>

        <p v-if="task.detail.description" class="task-description">
          {{ task.detail.description }}
        </p>

        <!-- 自定义任务的时间信息 -->
        <div
          v-if="task.detail.category === 'custom' && task.detail.taskDays"
          class="task-duration-info"
        >
          <span
            :class="[
              'duration-badge',
              {
                expired:
                  task.detail.taskDurationType === 'duration' &&
                  getDurationInfo(task.detail)?.isExpired,
              },
            ]"
          >
            <span v-if="task.detail.taskDurationType === 'deadline'">
              ⏰ {{ getDeadlineText(task.detail) }}
            </span>
            <span v-else>
              <template v-if="getDurationText(task.detail)">
                {{ getDurationText(task.detail) }}
              </template>
              <template v-else> 📅 连续 {{ task.detail.taskDays }} 天 </template>
            </span>
          </span>
        </div>

        <div v-if="task.remark" class="task-remark-display">
          <span class="remark-text">{{ task.remark }}</span>
        </div>
      </div>
    </div>

    <div v-if="localTasks.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>暂无任务</h3>
      <p>点击"添加任务"开始创建你的第一个任务吧！</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DailyTaskItem, TaskTemplate } from '@/types/task'
import { useTaskManagement } from '@/composables/useTaskManagement'
import { useAppStore } from '@/stores/app'
import { useDragSort } from '@/composables/useDragSort'

interface Props {
  tasks: (DailyTaskItem & { taskId: number; detail: any })[]
}

const props = defineProps<Props>()

// 拖拽排序：本地任务副本
const localTasks = ref<Props['tasks']>([])
const isDragging = ref(false) // 标记是否正在拖拽
const touchStartPosition = ref<{ x: number; y: number } | null>(null) // 记录触摸起始位置

watch(
  () => props.tasks,
  (val) => {
    localTasks.value = Array.isArray(val) ? [...val] : []
  },
  { immediate: true, deep: true },
)

const {
  taskData,
  showRemarkModal,
  currentTask,
  isTaskDue: baseIsTaskDue,
  getDurationInfo,
} = useTaskManagement()
const appStore = useAppStore()

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

// 完成任务（直接在组件中实现）
const handleCompleteTask = async (task: any) => {
  try {
    const todayRecord = getTodayRecord()
    if (todayRecord) {
      const completedAt = Date.now()
      await appStore.tasks.updateTaskCompletion(
        todayRecord.id,
        task.taskId,
        completedAt,
        task.remark, // 保留原有备注
      )
    }
    window.GlobalPlugin.toast.success('任务完成！')
  } catch (error) {
    console.error('完成任务失败:', error)
    window.GlobalPlugin.toast.error('完成任务失败')
  }
}

// 取消完成任务（直接在组件中实现）
const handleUncompleteTask = async (task: any) => {
  try {
    const todayRecord = getTodayRecord()
    if (todayRecord) {
      await appStore.tasks.updateTaskCompletion(
        todayRecord.id,
        task.taskId,
        undefined, // 清除完成时间
        task.remark, // 保留备注
      )
    }
    window.GlobalPlugin.toast.success('已取消完成')
  } catch (error) {
    console.error('取消完成失败:', error)
    window.GlobalPlugin.toast.error('取消完成失败')
  }
}

// 打开备注弹窗（直接在组件中实现）
const handleAddRemark = (task: any) => {
  currentTask.value = task
  showRemarkModal.value = true
}

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
  } catch (error) {
    console.error('更新排序失败:', error)
    window.GlobalPlugin.toast.error('更新排序失败')
  }
}

const isCompleted = (task: DailyTaskItem) => {
  return !!task.completedAt
}

const getCategoryLabel = (category: string) => {
  const labels = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月',
    custom: '自定义',
  }
  return labels[category as keyof typeof labels] || category
}

// 检查任务是否已到期（可以点击/拖拽）
// 已完成的任务即使未到期也可以点击（用于取消完成）
const isTaskDue = (task: DailyTaskItem): boolean => {
  // 已完成的任务可以点击（用于取消完成）
  if (isCompleted(task)) {
    return true
  }
  // 使用公共的到期检查逻辑
  return baseIsTaskDue(task)
}

// 获取到期时间文本
const getDeadlineText = (taskDetail: any) => {
  if (!taskDetail.taskDays || !taskDetail.startDate) return ''

  const startDate = new Date(taskDetail.startDate)
  startDate.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(startDate.getTime() + taskDetail.taskDays * 24 * 60 * 60 * 1000)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()
  const deadlineTimestamp = deadlineDate.getTime()

  const daysLeft = Math.ceil((deadlineTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))

  if (daysLeft < 0) {
    return `已过期 ${Math.abs(daysLeft)} 天`
  } else if (daysLeft === 0) {
    return '今天到期'
  } else if (daysLeft === 1) {
    return '明天到期'
  } else {
    return `${daysLeft} 天后到期`
  }
}

// 格式化结束日期
const formatEndDate = (date: Date): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const todayTimestamp = today.getTime()
  const targetTimestamp = targetDate.getTime()
  const daysDiff = Math.floor((targetTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))

  if (daysDiff === 0) {
    return '今天'
  } else if (daysDiff === 1) {
    return '明天'
  } else if (daysDiff === -1) {
    return '昨天'
  } else if (daysDiff > 0 && daysDiff <= 7) {
    return `${daysDiff} 天后`
  } else if (daysDiff < 0 && daysDiff >= -7) {
    return `${Math.abs(daysDiff)} 天前`
  } else {
    return `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`
  }
}

// 获取连续任务的显示文本（避免模板中重复调用）
const getDurationText = (taskDetail: any): string | null => {
  const durationInfo = getDurationInfo(taskDetail)
  if (!durationInfo) return null

  const endDateText = formatEndDate(durationInfo.endDate)

  if (durationInfo.isExpired) {
    return `⚠️ 已过期（${endDateText}）`
  } else {
    return `📅 剩余 ${durationInfo.daysLeft} 天（${endDateText} 结束）`
  }
}

const handleCardClick = (task: any) => {
  // 如果正在拖拽，不触发点击事件
  if (isDragging.value) return

  // 如果任务未到期，不允许点击
  if (!isTaskDue(task)) {
    return
  }

  if (isCompleted(task)) {
    // 如果已完成，点击卡片取消完成
    handleUncompleteTask(task)
  } else {
    // 如果未完成，点击卡片完成任务
    handleCompleteTask(task)
  }
}

const handleRemark = (task: any) => {
  handleAddRemark(task)
}

// 使用通用拖拽排序
const persistOrder = async () => {
  if (!taskData.value?.tasks) return

  const orderIds = localTasks.value.map((t) => t.detail.id)

  // 计算每个模板的排名，未出现在当前列表的放到后面，保持相对顺序
  const orderRank = new Map<number, number>()
  orderIds.forEach((id, idx) => orderRank.set(id, idx))

  const allTemplates = [...taskData.value.tasks]
  allTemplates.sort((a, b) => {
    const ra = orderRank.has(a.id) ? (orderRank.get(a.id) as number) : 10000 + a.sort
    const rb = orderRank.has(b.id) ? (orderRank.get(b.id) as number) : 10000 + b.sort
    return ra - rb
  })

  // 重写 sort 并提交
  allTemplates.forEach((t, i) => (t.sort = i + 1))
  await handleUpdateOrder(allTemplates)
}

const {
  onDragStart: baseDragStart,
  onDragOver: baseDragOver,
  onDragEnd: baseDragEnd,
  onDrop: baseDrop,
  onTouchStart: baseTouchStart,
  onTouchMove: baseTouchMove,
  onTouchEnd: baseTouchEnd,
  dropIndex,
  dragIndex,
} = useDragSort((items: any[]) => {
  localTasks.value = items as any
  persistOrder()
})

// 包装鼠标拖拽事件，处理拖拽标记
const onDragStart = (index: number, task: DailyTaskItem) => {
  // 检查任务是否已到期
  if (!isTaskDue(task)) {
    return
  }
  isDragging.value = true
  baseDragStart(index)
}

// 包装 dragover，阻止拖拽到未到期任务上
const onDragOver = (index: number) => {
  // 如果目标是未到期任务，阻止拖拽
  if (!isTaskDue(localTasks.value[index])) {
    return
  }
  baseDragOver(index)
}

// 包装 drop，阻止拖拽到未到期任务上
const onDrop = (items: any[], index: number) => {
  // 如果目标是未到期任务，阻止 drop
  if (!isTaskDue(localTasks.value[index])) {
    return
  }
  baseDrop(items, index)
}

const onDragEnd = () => {
  baseDragEnd()
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

// 根据卡片元素获取索引（用于触摸事件）
const getCardIndex = (element: Element): number => {
  const taskList = element.closest('.task-list')
  if (!taskList) return -1

  const cards = Array.from(taskList.querySelectorAll('.task-card'))
  return cards.indexOf(element)
}

// 包装触摸事件，处理拖拽标记
const onTouchStart = (index: number, task: DailyTaskItem, event: TouchEvent) => {
  // 检查任务是否已到期
  if (!isTaskDue(task)) {
    event.preventDefault()
    return
  }
  isDragging.value = false
  // 记录触摸起始位置，用于判断是否发生了拖拽
  touchStartPosition.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  }
  baseTouchStart(index, event)
}

const onTouchMove = (event: TouchEvent, getElementIndex: (element: Element) => number) => {
  if (!isDragging.value) {
    isDragging.value = true
  }
  baseTouchMove(event, getElementIndex)

  // 检查当前 dropIndex 是否指向未到期任务，如果是则清除 dropIndex
  if (
    dropIndex.value !== null &&
    dropIndex.value >= 0 &&
    dropIndex.value < localTasks.value.length
  ) {
    if (!isTaskDue(localTasks.value[dropIndex.value])) {
      // 如果目标是未到期任务，清除 dropIndex，防止拖拽生效
      dropIndex.value = null
    }
  }
}

const onTouchEnd = (items: any[], task: DailyTaskItem, index: number, event: TouchEvent) => {
  // 检查 dropIndex 是否指向未到期任务
  if (
    dropIndex.value !== null &&
    dropIndex.value >= 0 &&
    dropIndex.value < localTasks.value.length
  ) {
    if (!isTaskDue(localTasks.value[dropIndex.value])) {
      // 如果目标是未到期任务，阻止 drop，只重置状态
      dropIndex.value = null
      isDragging.value = false
      touchStartPosition.value = null
      // 触发点击事件
      setTimeout(() => {
        handleCardClick(task)
      }, 50)
      return
    }
  }

  // 判断是否发生了拖拽：检查是否有移动或者 dragIndex 和 dropIndex 不同
  const hadMovement =
    isDragging.value && dropIndex.value !== null && dragIndex.value !== dropIndex.value

  // 如果没有发生拖拽，触发点击事件
  if (!hadMovement && !isDragging.value) {
    baseTouchEnd(items)
    touchStartPosition.value = null
    // 延迟触发点击，确保拖拽状态已清除
    setTimeout(() => {
      handleCardClick(task)
    }, 50)
    return
  }

  // 发生了拖拽，执行拖拽逻辑
  baseTouchEnd(items)
  touchStartPosition.value = null
  // 延迟清除标记，避免触发点击事件
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

// 颜色映射
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

// 获取卡片样式
const getCardStyle = (task: any) => {
  const bgColor = task.detail.bgColor || 'default'
  return {
    background: colorGradients[bgColor] || colorGradients.default,
  }
}
</script>

<style lang="scss" scoped>
.task-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 10px;

  .task-card {
    border: none;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      &::before {
        opacity: 1;
      }
    }

    &.not-due {
      cursor: not-allowed;
      opacity: 0.6;
      filter: grayscale(40%);
      position: relative;

      &::after {
        content: '🔒';
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 1.2rem;
        opacity: 0.7;
      }

      &:hover {
        transform: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }

    &.completed {
      cursor: pointer;
      opacity: 0.9;
      filter: grayscale(50%) brightness(0.95);
      border: 2px solid #10b981;
      box-shadow: 0 2px 12px rgba(16, 185, 129, 0.25);

      &::before {
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        opacity: 1;
        height: 5px;
      }

      &::after {
        content: '✓';
        position: absolute;
        bottom: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
      }

      .task-title {
        text-decoration: line-through;
        opacity: 0.8;
        color: #6b7280;
      }

      .task-description {
        opacity: 0.7;
        color: #9ca3af;
      }
    }

    .task-content {
      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 14px;

        .task-title {
          flex: 1;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }

        .task-meta {
          display: flex;
          gap: 8px;
          margin-left: 12px;
          align-items: center;
          flex-shrink: 0;

          .category-badge {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;

            &.daily {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }

            &.weekly {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
            }

            &.monthly {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
            }

            &.custom {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              color: white;
            }
          }

          .btn-remark-icon {
            padding: 6px 10px;
            border: none;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);

            &:hover {
              transform: scale(1.15) rotate(10deg);
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
            }
          }
        }
      }

      .task-description {
        color: var(--text-secondary);
        font-size: 0.95rem;
        line-height: 1.6;
        margin: 0 0 8px 0;
      }

      .task-duration-info {
        margin-top: 10px;
        margin-bottom: 8px;

        .duration-badge {
          display: inline-block;
          padding: 6px 12px;
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.1) 0%,
            rgba(118, 75, 162, 0.1) 100%
          );
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.2);
          transition: all 0.3s ease;

          &.expired {
            background: linear-gradient(
              135deg,
              rgba(239, 68, 68, 0.1) 0%,
              rgba(220, 38, 38, 0.1) 100%
            );
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.3);
          }
        }
      }

      .task-remark-display {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(245, 158, 11, 0.08);
        border-left: 3px solid #f59e0b;
        border-radius: 6px;
        margin-top: 12px;

        .remark-text {
          flex: 1;
          font-size: 0.9rem;
          color: var(--text-primary);
          line-height: 1.5;
          word-break: break-word;
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-secondary);
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;

    .empty-icon {
      font-size: 5rem;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    h3 {
      font-size: 1.8rem;
      margin-bottom: 12px;
      color: var(--text-primary);
      font-weight: 600;
    }

    p {
      font-size: 1.1rem;
      color: var(--text-secondary);
    }
  }
}

@media (max-width: 1200px) {
  .task-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .task-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 0;
  }
}

@media (max-width: 400px) {
  .task-list {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
