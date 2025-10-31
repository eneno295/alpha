import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import type { TaskTemplate } from '@/types/task'

// 单例状态
const showAddTaskModal = ref(false)
const showManageModal = ref(false)
const showHistoryModal = ref(false)
const showRemarkModal = ref(false)
const editingTask = ref<TaskTemplate | null>(null)
const currentTask = ref<any>(null) // 当前要添加备注的任务
const selectedCategory = ref<string>('all')
const isReadonly = ref(false) // 是否只读模式（查看详情）

export function useTaskManagement() {
  const appStore = useAppStore()

  const taskData = computed(() => appStore.tasks.data)

  // 以天为单位的归一化（避免时区/小时差导致的同日不等）
  const toDayKey = (timestamp: number): number => Math.floor(timestamp / (24 * 60 * 60 * 1000))

  // 获取今天0点的时间戳
  const getTodayTimestamp = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.getTime()
  }

  // 生成今天的任务
  const generateTodayTasks = async () => {
    const todayTimestamp = getTodayTimestamp()
    if (!appStore.currentUser || !taskData.value) return

    appStore.tasks.initTaskData()

    if (!taskData.value.date) return

    const todayKey = toDayKey(todayTimestamp)
    let todayRecord = taskData.value.date.find((record) => toDayKey(record.date) === todayKey)

    if (!todayRecord) {
      const maxId =
        taskData.value.date.length > 0 ? Math.max(...taskData.value.date.map((d) => d.id)) : 0

      todayRecord = {
        id: maxId + 1,
        date: todayTimestamp,
        tasks: [],
      }

      const sortedTemplates = [...taskData.value.tasks].sort((a, b) => a.sort - b.sort)
      sortedTemplates.forEach((template) => {
        todayRecord!.tasks.push({
          taskId: template.id,
          detail: { ...template },
        })
      })

      // 添加日期记录（直接在 composable 中实现）
      appStore.currentUser!.tasks!.date.push(todayRecord)
      await appStore.api.updateData()
    }
  }

  // 获取今天的记录
  const getTodayRecord = () => {
    const todayTimestamp = getTodayTimestamp()
    if (!taskData.value || !taskData.value.date) return undefined
    const todayKey = toDayKey(todayTimestamp)
    return taskData.value.date.find((record) => toDayKey(record.date) === todayKey)
  }

  // 计算属性
  const activeTasksCount = computed(() => {
    const todayRecord = getTodayRecord()
    return todayRecord ? todayRecord.tasks.length : 0
  })

  const todayCompletedCount = computed(() => {
    const todayRecord = getTodayRecord()
    return todayRecord ? todayRecord.tasks.filter((t) => t.completedAt).length : 0
  })

  // 检查任务是否已到期（公共函数，不检查完成状态）
  const isTaskDue = (task: any): boolean => {
    // 如果不是自定义任务，都已到期
    if (task.detail.category !== 'custom') {
      return true
    }

    // 如果是持续天数类型，检查是否在连续天数范围内
    if (task.detail.taskDurationType === 'duration' && task.detail.startDate && task.detail.taskDays) {
      const startDate = new Date(task.detail.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate.getTime() + task.detail.taskDays * 24 * 60 * 60 * 1000)
      endDate.setHours(0, 0, 0, 0)

      const todayTimestamp = getTodayTimestamp()
      const startTimestamp = startDate.getTime()
      const endTimestamp = endDate.getTime()

      // 只有今天在开始日期之后，且在结束日期之前或当天，才算已到期（可点击）
      return todayTimestamp >= startTimestamp && todayTimestamp <= endTimestamp
    }

    // 如果是到期天数类型，检查是否已到期
    if (
      task.detail.taskDurationType === 'deadline' &&
      task.detail.startDate &&
      task.detail.taskDays
    ) {
      const startDate = new Date(task.detail.startDate)
      startDate.setHours(0, 0, 0, 0)
      const deadlineDate = new Date(
        startDate.getTime() + task.detail.taskDays * 24 * 60 * 60 * 1000,
      )
      deadlineDate.setHours(0, 0, 0, 0)

      const todayTimestamp = getTodayTimestamp()
      const deadlineTimestamp = deadlineDate.getTime()

      // 只有今天 >= 到期日期时，才算已到期
      return todayTimestamp >= deadlineTimestamp
    }

    // 默认已到期
    return true
  }

  // 获取连续任务的剩余天数和结束日期信息
  const getDurationInfo = (taskDetail: any): { daysLeft: number; endDate: Date; isExpired: boolean } | null => {
    if (!taskDetail.taskDays || !taskDetail.startDate || taskDetail.taskDurationType !== 'duration') {
      return null
    }

    const startDate = new Date(taskDetail.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate.getTime() + taskDetail.taskDays * 24 * 60 * 60 * 1000)
    endDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()
    const endTimestamp = endDate.getTime()

    const daysLeft = Math.ceil((endTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))
    const isExpired = todayTimestamp > endTimestamp

    return {
      daysLeft,
      endDate,
      isExpired,
    }
  }

  const filteredTasks = computed(() => {
    const todayRecord = getTodayRecord()
    if (!todayRecord) return []

    let tasks = todayRecord.tasks

    if (selectedCategory.value !== 'all') {
      tasks = tasks.filter((t) => t.detail.category === selectedCategory.value)
    }

    // 排序：已到期的在前，未到期的在后；相同状态下按 sort 排序
    return tasks.sort((a, b) => {
      const aDue = isTaskDue(a)
      const bDue = isTaskDue(b)

      // 如果到期状态不同，已到期的排在前面
      if (aDue !== bDue) {
        return aDue ? -1 : 1
      }

      // 如果到期状态相同，按 sort 排序
      return a.detail.sort - b.detail.sort
    })
  })

  // 初始化（不包含 fetchData，由 useAppInitialization 统一处理）
  const initialize = async () => {
    appStore.tasks.initTaskData()
    await generateTodayTasks()
  }

  return {
    // 状态
    taskData,
    showAddTaskModal,
    showManageModal,
    showHistoryModal,
    showRemarkModal,
    editingTask,
    currentTask,
    selectedCategory,
    isReadonly,

    // 计算属性
    activeTasksCount,
    todayCompletedCount,
    filteredTasks,

    // 方法
    initialize,
    isTaskDue, // 公共的到期检查函数
    getDurationInfo, // 获取连续任务的时间信息
  }
}