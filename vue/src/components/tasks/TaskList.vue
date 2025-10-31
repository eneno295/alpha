<template>
  <div class="task-list">
    <div
      v-for="(task, index) in localTasks"
      :key="task.taskId"
      :class="['task-card', { completed: isCompleted(task) }]"
      :style="getCardStyle(task)"
      @click="handleCardClick(task)"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragover.prevent="onDragOver(index)"
      @drop="onDrop(localTasks, index)"
      @dragend="onDragEnd"
      @touchstart="onTouchStart(index, $event)"
      @touchmove.prevent="onTouchMove($event, getCardIndex)"
      @touchend="onTouchEnd(localTasks)"
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

watch(
  () => props.tasks,
  (val) => {
    localTasks.value = Array.isArray(val) ? [...val] : []
  },
  { immediate: true, deep: true },
)

const { taskData, showRemarkModal, currentTask } = useTaskManagement()
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

const handleCardClick = (task: any) => {
  // 如果正在拖拽，不触发点击事件
  if (isDragging.value) return

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
  onDragOver,
  onDragEnd: baseDragEnd,
  onDrop,
  onTouchStart: baseTouchStart,
  onTouchMove: baseTouchMove,
  onTouchEnd: baseTouchEnd,
  dropIndex,
} = useDragSort((items: any[]) => {
  localTasks.value = items as any
  persistOrder()
})

// 包装鼠标拖拽事件，处理拖拽标记
const onDragStart = (index: number) => {
  isDragging.value = true
  baseDragStart(index)
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
const onTouchStart = (index: number, event: TouchEvent) => {
  isDragging.value = false
  baseTouchStart(index, event)
}

const onTouchMove = (event: TouchEvent, getElementIndex: (element: Element) => number) => {
  if (!isDragging.value) {
    isDragging.value = true
  }
  baseTouchMove(event, getElementIndex)
}

const onTouchEnd = (items: any[]) => {
  const hadMovement = isDragging.value && dropIndex.value !== null
  baseTouchEnd(items)
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
