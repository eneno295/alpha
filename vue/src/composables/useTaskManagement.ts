import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import type { TaskTemplate } from '@/types/task'
import { formatTime } from '@/utils/format'

// 单例状态
const showAddTaskModal = ref(false)
const showManageModal = ref(false)
const showHistoryModal = ref(false)
const showRemarkModal = ref(false)
const editingTask = ref<TaskTemplate | null>(null)
const currentTask = ref<any>(null) // 当前要添加备注的任务
const selectedCategory = ref<string>('pending')
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
    if (!todayRecord) return 0
    // 只统计应该计入今日任务的任务（排除未开始和已过期的任务）
    return todayRecord.tasks.filter((t) => isTaskCountable(t)).length
  })

  const todayCompletedCount = computed(() => {
    const todayRecord = getTodayRecord()
    if (!todayRecord) return 0
    // 只统计应该计入今日任务且已完成的任务
    return todayRecord.tasks.filter((t) => isTaskCountable(t) && t.completedAt).length
  })

  // 获取任务的模板数据（实时数据，不是历史快照）
  const getTaskTemplate = (task: any): TaskTemplate | null => {
    if (task.taskId && taskData.value?.tasks) {
      const template = taskData.value.tasks.find((t) => t.id === task.taskId)
      return template || null
    }
    return null
  }

  // 获取任务的原始 startDate（优先从模板获取，避免使用可能过期的 detail 快照）
  const getTaskStartDate = (task: any): number | null => {
    const template = getTaskTemplate(task)
    if (template?.startDate) {
      return template.startDate
    }
    // 如果没有模板，使用 detail 中的值（历史记录场景）
    const detail = task.detail || task
    return detail.startDate || null
  }

  // 检查任务是否应该统计在指定日期的任务中（排除已过期和未开始的任务）
  // targetDateTimestamp: 目标日期的0点时间戳，如果不提供则使用今天
  const isTaskCountable = (task: any, targetDateTimestamp?: number): boolean => {
    // 优先从模板获取 category（实时数据）
    const template = getTaskTemplate(task)
    const category = template?.category || task.detail.category

    // 每日任务都统计
    if (category === 'daily') {
      return true
    }

    const checkTimestamp = targetDateTimestamp || getTodayTimestamp()
    const startDateValue = getTaskStartDate(task)
    if (!startDateValue) return true // 如果没有 startDate，默认可统计

    // 如果是连续完成类型，检查是否在开始日期和结束日期之间
    if (category === 'duration') {
      const endDateValue = template?.endDate || task.detail.endDate
      if (!endDateValue) return true

      const startTimestamp = startDateValue
      const endDate = new Date(endDateValue)
      endDate.setHours(0, 0, 0, 0)
      const endTimestamp = endDate.getTime()

      // 只有目标日期在开始日期之后，且在结束日期之前或当天，才算可统计
      return checkTimestamp >= startTimestamp && checkTimestamp <= endTimestamp
    }

    // 如果是到期完成类型，只有目标日期正好是到期日期时才统计
    if (category === 'deadline') {
      const deadlineDateValue = template?.deadlineDate || task.detail.deadlineDate || startDateValue
      const deadlineDate = new Date(deadlineDateValue)
      deadlineDate.setHours(0, 0, 0, 0)
      const deadlineTimestamp = deadlineDate.getTime()

      // 只有目标日期正好是到期日期时，才算可统计
      // 已过期（目标日期 > 到期日期）和未开始（目标日期 < 到期日期）都不统计
      return checkTimestamp === deadlineTimestamp
    }

    // 默认可统计
    return true
  }

  // 检查任务是否已开始且未过期（用于判断是否可以点击/拖拽）
  const isTaskDue = (task: any): boolean => {
    // 优先从模板获取 category（实时数据）
    const template = getTaskTemplate(task)
    const category = template?.category || task.detail.category
    const todayTimestamp = getTodayTimestamp()

    // 每日任务总是已开始且永不过期
    if (category === 'daily') {
      return true
    }

    const startDateValue = getTaskStartDate(task)
    if (!startDateValue) return true // 如果没有 startDate，默认允许操作

    // 连续完成：检查今天是否在开始日期和结束日期之间（包含边界）
    if (category === 'duration') {
      const endDateValue = template?.endDate || task.detail.endDate
      if (!endDateValue) return true

      const startTimestamp = startDateValue
      const endDate = new Date(endDateValue)
      endDate.setHours(0, 0, 0, 0)
      const endTimestamp = endDate.getTime()

      // 必须在开始日期之后，且在结束日期之前或当天
      return todayTimestamp >= startTimestamp && todayTimestamp <= endTimestamp
    }

    // 到期完成：检查今天是否正好是到期日期（只有到期当天可以点击）
    if (category === 'deadline') {
      const deadlineDateValue = template?.deadlineDate || task.detail.deadlineDate || startDateValue
      const deadlineDate = new Date(deadlineDateValue)
      deadlineDate.setHours(0, 0, 0, 0)
      const deadlineTimestamp = deadlineDate.getTime()

      // 只有到期当天可以点击，之后都禁用
      return todayTimestamp === deadlineTimestamp
    }

    // 默认返回 true（如果数据不完整，允许操作）
    return true
  }

  // 获取任务的日期说明信息
  const getTaskDateInfo = (task: any): { text: string; status: 'normal' | 'expired' | 'not-started' } | null => {
    // 优先从模板获取数据（实时数据）
    const template = getTaskTemplate(task)
    const category = template?.category || task.detail.category

    // 连续完成：显示开始日期 - 结束日期
    if (category === 'duration') {
      const startDateValue = getTaskStartDate(task)
      const endDateValue = template?.endDate || task.detail.endDate
      if (!startDateValue || !endDateValue) return null

      const startDate = new Date(startDateValue)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(endDateValue)
      endDate.setHours(0, 0, 0, 0)

      const startDateStr = formatTime(startDate.getTime(), true)
      const endDateStr = formatTime(endDate.getTime(), true)

      const todayTimestamp = getTodayTimestamp()
      const endTimestamp = endDate.getTime()

      let status: 'normal' | 'expired' | 'not-started' = 'normal'
      let text = `${startDateStr} - ${endDateStr}`

      if (todayTimestamp < startDateValue) {
        status = 'not-started'
        text = `${startDateStr} - ${endDateStr}（未开始）`
      } else if (todayTimestamp > endTimestamp) {
        status = 'expired'
        text = `${startDateStr} - ${endDateStr}（已过期）`
      }

      return {
        text,
        status
      }
    }

    // 到期完成：显示到期日期，根据状态显示不同文本
    if (category === 'deadline') {
      const deadlineDateValue = template?.deadlineDate || task.detail.deadlineDate
      if (!deadlineDateValue) return null

      const deadlineDate = new Date(deadlineDateValue)
      deadlineDate.setHours(0, 0, 0, 0)
      const deadlineDateStr = formatTime(deadlineDate.getTime(), true)
      const deadlineTimestamp = deadlineDate.getTime()
      const todayTimestamp = getTodayTimestamp()

      let status: 'normal' | 'expired' | 'not-started' = 'normal'
      let text = deadlineDateStr

      if (todayTimestamp < deadlineTimestamp) {
        status = 'not-started'
        text = `${deadlineDateStr}（未开始）`
      } else if (todayTimestamp > deadlineTimestamp) {
        status = 'expired'
        text = `${deadlineDateStr}（已过期）`
      } else {
        status = 'normal'
        text = deadlineDateStr
      }

      return { text, status }
    }

    return null
  }

  // 更新今天记录的 detail 快照（只更新今天，旧数据保持不变）
  const updateTodayRecordDetails = (callback: (task: any, template: TaskTemplate) => void) => {
    if (!taskData.value?.date) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    taskData.value.date.forEach((record) => {
      // 只更新今天的记录
      if (record.date === todayTimestamp) {
        record.tasks.forEach((task) => {
          const template = getTaskTemplate(task)
          if (template) {
            callback(task, template)
          }
        })
      }
    })
  }

  const filteredTasks = computed(() => {
    const todayRecord = getTodayRecord()
    if (!todayRecord) return []

    let tasks = todayRecord.tasks

    // 全部待完成：只显示未完成的任务（且可统计的）
    if (selectedCategory.value === 'pending') {
      tasks = tasks.filter((t) => {
        return isTaskCountable(t) && !t.completedAt
      })
    } else if (selectedCategory.value !== 'all') {
      tasks = tasks.filter((t) => {
        // 优先从模板获取 category（实时数据）
        const template = getTaskTemplate(t)
        const category = template?.category || t.detail.category
        return category === selectedCategory.value
      })
    }

    // 按 sort 排序（优先从模板获取 sort）
    return tasks.sort((a, b) => {
      const templateA = getTaskTemplate(a)
      const templateB = getTaskTemplate(b)
      const sortA = templateA?.sort ?? a.detail.sort ?? 0
      const sortB = templateB?.sort ?? b.detail.sort ?? 0
      return sortA - sortB
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
    isTaskCountable, // 公共的统计检查函数（排除已过期和未开始）
    getTaskDateInfo, // 获取任务的日期说明信息
    getTaskTemplate, // 获取任务的模板数据（实时数据）
    updateTodayRecordDetails, // 更新今天记录的 detail 快照
  }
}