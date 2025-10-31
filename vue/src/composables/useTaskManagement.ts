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

  const filteredTasks = computed(() => {
    const todayRecord = getTodayRecord()
    if (!todayRecord) return []

    let tasks = todayRecord.tasks

    if (selectedCategory.value !== 'all') {
      tasks = tasks.filter((t) => t.detail.category === selectedCategory.value)
    }

    return tasks.sort((a, b) => a.detail.sort - b.detail.sort)
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

    // 计算属性
    activeTasksCount,
    todayCompletedCount,
    filteredTasks,

    // 方法
    initialize,
  }
}