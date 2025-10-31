<template>
  <BaseModal
    :visible="showHistoryModal"
    title="完成历史"
    size="large"
    @close="showHistoryModal = false"
  >
    <div class="history-content">
      <div class="history-filters">
        <select v-model="filter">
          <option value="all">全部</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
      </div>

      <div class="history-list">
        <div v-for="record in filteredRecords" :key="record.id" class="history-day-item">
          <div class="day-header" @click="toggleExpand(record.id)">
            <div class="day-info">
              <h3>{{ formatDate(record.date) }}</h3>
              <span class="task-stats">
                {{ getCompletedCount(record) }}/{{ record.tasks.length }} 已完成
              </span>
            </div>
            <div class="day-actions" @click.stop>
              <button
                v-if="showDeleteTask"
                class="btn-day-delete"
                title="删除当天记录"
                @click="handleDeleteDateRecord(record.id)"
              >
                🗑️
              </button>
              <span class="expand-icon">{{ expandedIds.includes(record.id) ? '▼' : '▶' }}</span>
            </div>
          </div>

          <div v-if="expandedIds.includes(record.id)" class="day-tasks">
            <div
              v-for="task in record.tasks"
              :key="task.taskId"
              :class="['task-item', { completed: task.completedAt, 'has-remark': task.remark }]"
              style="cursor: pointer"
              @click.stop="handleViewTask(task)"
              @mouseenter="(e) => showTooltip(task.taskId, task.remark, e)"
              @mouseleave="hideTooltip"
            >
              <span class="task-status">{{ task.completedAt ? '✅' : '❌' }}</span>
              <div class="task-content">
                <span class="task-title">{{ task.detail.title }}</span>
                <span v-if="task.completedAt" class="task-time">{{
                  formatTime(task.completedAt)
                }}</span>
                <span v-if="task.remark" class="task-remark">📝</span>
              </div>

              <!-- Tooltip -->
              <div
                v-if="tooltipVisible && tooltipTaskId === task.taskId && task.remark"
                class="tooltip"
              >
                {{ task.remark }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="empty-state">
          <div class="empty-icon">📜</div>
          <h3>暂无历史记录</h3>
          <p>完成任务后，记录将显示在这里</p>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskManagement } from '@/composables/useTaskManagement'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import BaseModal from '@/components/common/BaseModal.vue'

const { showHistoryModal, taskData, editingTask, showAddTaskModal, isReadonly } =
  useTaskManagement()
const appStore = useAppStore()
const { withLoading } = useLoading()

// 是否显示删除按钮（直接从 taskData 中读取配置）
const showDeleteTask = computed(() => taskData.value?.config?.showDeleteTask ?? false)

// 删除整天记录（直接在组件中实现）
const deleteDateRecord = async (dateRecordId: number) => {
  if (!appStore.currentUser || !appStore.currentUser.tasks) throw new Error('任务数据不存在')

  appStore.currentUser.tasks.date = appStore.currentUser.tasks.date.filter(
    (r) => r.id !== dateRecordId,
  )

  await appStore.api.updateData()
}

// 删除整天记录（直接在组件中实现）
const handleDeleteDateRecord = async (recordId: number) => {
  if (!confirm('确定要删除这一天的全部记录吗？\n\n此操作不会影响任务模板，仅删除该天的完成情况。'))
    return
  try {
    await withLoading(async () => {
      await deleteDateRecord(recordId)
    }, '删除当天记录中...')

    window.GlobalPlugin.toast.success('当天记录已删除')
  } catch (error) {
    console.error('删除当天记录失败:', error)
    window.GlobalPlugin.toast.error('删除当天记录失败')
  }
}

const filter = ref<string>('all')
const expandedIds = ref<number[]>([])
const tooltipVisible = ref(false)
const tooltipTaskId = ref<number | null>(null)

// 获取所有日期记录
const allRecords = computed(() => {
  if (!taskData.value?.date) return []
  return [...taskData.value.date].sort((a, b) => b.date - a.date)
})

// 过滤记录
const filteredRecords = computed(() => {
  const now = Date.now()
  let records = allRecords.value

  switch (filter.value) {
    case 'week':
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000
      records = records.filter((r) => r.date >= weekAgo)
      break
    case 'month':
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000
      records = records.filter((r) => r.date >= monthAgo)
      break
  }

  return records
})

// 获取完成任务数
const getCompletedCount = (record: any) => {
  return record.tasks.filter((t: any) => t.completedAt).length
}

// 切换展开/收起
const toggleExpand = (id: number) => {
  const index = expandedIds.value.indexOf(id)
  if (index > -1) {
    expandedIds.value.splice(index, 1)
  } else {
    expandedIds.value.push(id)
  }
}

// 格式化日期（时间戳转日期）
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  const yesterday = new Date(todayTimestamp - 24 * 60 * 60 * 1000)
  const yesterdayTimestamp = yesterday.getTime()

  // 判断是否同一天（使用日期字符串比较，避免时间戳精度问题）
  const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`

  if (dateStr === todayStr) return '今天'
  if (dateStr === yesterdayStr) return '昨天'

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 格式化时间（时间戳转时间）
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 显示 tooltip
const showTooltip = (taskId: number, remark: string | undefined, event: MouseEvent) => {
  if (!remark) return
  tooltipTaskId.value = taskId
  tooltipVisible.value = true
}

// 隐藏 tooltip
const hideTooltip = () => {
  tooltipVisible.value = false
  tooltipTaskId.value = null
}

// 查看任务详情
const handleViewTask = (task: any) => {
  // 使用任务快照中的详情
  editingTask.value = task.detail
  isReadonly.value = true
  showAddTaskModal.value = true
}
</script>

<style lang="scss" scoped>
.history-content {
  .history-filters {
    margin-bottom: 20px;

    select {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
    }
  }

  .history-list {
    max-height: 500px;
    overflow-y: auto;

    .history-day-item {
      margin-bottom: 12px;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: linear-gradient(
          135deg,
          rgba(102, 126, 234, 0.02) 0%,
          rgba(118, 75, 162, 0.02) 100%
        );

        &:hover {
          background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.05) 0%,
            rgba(118, 75, 162, 0.05) 100%
          );
        }

        .day-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;

          h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: 0.3px;
          }

          .task-stats {
            font-size: 0.85rem;
            color: var(--text-secondary);
            background: rgba(102, 126, 234, 0.08);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
          }
        }

        .day-actions {
          display: flex;
          align-items: center;
          gap: 8px;

          .btn-day-delete {
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 1rem;
            opacity: 0.6;
            transition:
              opacity 0.2s ease,
              transform 0.1s ease;

            &:hover {
              opacity: 1;
              transform: scale(1.08);
            }
          }

          .expand-icon {
            font-size: 0.9rem;
            color: var(--text-secondary);
            transition: transform 0.2s ease;
          }
        }
      }

      .day-tasks {
        border-top: 1px solid var(--border-color);
        padding: 12px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 10px;

        .task-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-primary);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
          cursor: default;

          &:hover {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }

          &.completed {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.03);
          }

          &:not(.completed) {
            border-color: #e5e7eb;
            opacity: 0.75;
          }

          &.has-remark {
            cursor: help;
          }

          .task-status {
            font-size: 1rem;
            flex-shrink: 0;
          }

          .task-content {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;

            .task-title {
              flex: 1;
              font-size: 0.9rem;
              font-weight: 500;
              color: var(--text-primary);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .task-time {
              flex-shrink: 0;
              font-size: 0.8rem;
              color: #10b981;
              font-weight: 500;
            }

            .task-remark {
              flex-shrink: 0;
              font-size: 0.9rem;
            }
          }

          .tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            white-space: nowrap;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: tooltipFadeIn 0.15s ease-out;

            &::after {
              content: '';
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              border: 6px solid transparent;
              border-top-color: rgba(0, 0, 0, 0.9);
            }
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 1.5rem;
        margin-bottom: 8px;
        color: var(--text-primary);
      }

      p {
        font-size: 1rem;
      }
    }
  }
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
