import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import type { TaskTemplate, DailyTaskItem } from '@/types'

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
  const { withLoading } = useLoading()

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

      await appStore.tasks.addDateRecord(todayRecord)
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

  const filteredCompletions = computed(() => {
    let allCompletions: Array<DailyTaskItem & { recordDate: number }> = []

    if (taskData.value && taskData.value.date) {
      taskData.value.date.forEach((record) => {
        record.tasks.forEach((task) => {
          if (task.completedAt) {
            allCompletions.push({
              ...task,
              recordDate: record.date,
            })
          }
        })
      })
    }

    return allCompletions
  })

  // 关闭添加任务弹窗
  const closeAddTaskModal = () => {
    showAddTaskModal.value = false
    editingTask.value = null
  }

  // 完成任务
  const handleCompleteTask = async (task: any) => {
    try {
      // 不显示加载提示，直接执行
      const todayRecord = getTodayRecord()
      if (todayRecord) {
        const completedAt = Date.now() // 使用时间戳
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

  // 取消完成任务
  const handleUncompleteTask = async (task: any) => {
    try {
      // 不显示加载提示，直接执行
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

  // 打开备注弹窗
  const handleAddRemark = (task: any) => {
    currentTask.value = task
    showRemarkModal.value = true
  }

  // 保存备注
  const handleSaveRemark = async (remark: string) => {
    if (!currentTask.value) return

    try {
      await withLoading(async () => {
        const todayRecord = getTodayRecord()
        if (todayRecord) {
          await appStore.tasks.updateTaskCompletion(
            todayRecord.id,
            currentTask.value.taskId,
            currentTask.value.completedAt, // 保持原有的完成时间
            remark.trim() || undefined, // 如果备注为空则删除
          )
        }
      }, '保存备注中...')

      showRemarkModal.value = false
      currentTask.value = null
      window.GlobalPlugin.toast.success(remark.trim() ? '备注已保存' : '备注已清除')
    } catch (error) {
      console.error('保存备注失败:', error)
      window.GlobalPlugin.toast.error('保存备注失败')
    }
  }

  // 关闭备注弹窗
  const closeRemarkModal = () => {
    showRemarkModal.value = false
    currentTask.value = null
  }

  // 编辑任务
  const handleEditTask = (task: any) => {
    if (!taskData.value || !taskData.value.tasks) return

    const template = taskData.value.tasks.find((t) => t.id === task.taskId)
    if (template) {
      editingTask.value = template
      showAddTaskModal.value = true
    }
  }

  // 删除任务
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('确定要删除这个任务模板吗？\n\n将删除模板及今天和未来的任务，历史记录会保留。')) return

    try {
      await withLoading(async () => {
        await appStore.tasks.deleteTemplate(taskId)
      }, '删除任务中...')

      window.GlobalPlugin.toast.success('任务模板已删除')
    } catch (error) {
      console.error('删除任务失败:', error)
      window.GlobalPlugin.toast.error('删除任务失败')
    }
  }

  // 保存任务
  const handleSaveTask = async (formData: {
    title: string
    description: string
    category: string
    bgColor: string
  }) => {
    if (!taskData.value) return

    const isEditing = !!editingTask.value // 先保存状态

    try {
      await withLoading(
        async () => {
          if (editingTask.value) {
            await appStore.tasks.updateTemplate(editingTask.value.id, {
              title: formData.title,
              description: formData.description,
              category: formData.category as any,
              bgColor: formData.bgColor,
            })
          } else {
            appStore.tasks.initTaskData()

            const maxId =
              taskData.value.tasks && taskData.value.tasks.length > 0
                ? Math.max(...taskData.value.tasks.map((t) => t.id))
                : 0
            const maxSort =
              taskData.value.tasks && taskData.value.tasks.length > 0
                ? Math.max(...taskData.value.tasks.map((t) => t.sort))
                : 0

            const newTemplate: TaskTemplate = {
              id: maxId + 1,
              title: formData.title,
              description: formData.description,
              category: formData.category as any,
              sort: maxSort + 1,
              bgColor: formData.bgColor,
            }

            await appStore.tasks.addTemplate(newTemplate)

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

  // 更新排序（静默更新，不显示加载弹窗）
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

  // 删除完成记录
  const handleDeleteCompletion = async (taskId: number, recordDate: number) => {
    if (!confirm('确定要删除这条完成记录吗？')) return
    if (!taskData.value || !taskData.value.date) return

    try {
      await withLoading(async () => {
        const record = taskData.value.date.find((r) => r.date === recordDate)
        if (record) {
          await appStore.tasks.updateTaskCompletion(record.id, taskId, undefined, undefined)
        }
      }, '删除记录中...')

      window.GlobalPlugin.toast.success('记录已删除')
    } catch (error) {
      console.error('删除记录失败:', error)
      window.GlobalPlugin.toast.error('删除记录失败')
    }
  }

  // 删除整天记录
  const handleDeleteDateRecord = async (recordId: number) => {
    if (!confirm('确定要删除这一天的全部记录吗？\n\n此操作不会影响任务模板，仅删除该天的完成情况。')) return
    try {
      await withLoading(async () => {
        await appStore.tasks.deleteDateRecord(recordId)
      }, '删除当天记录中...')

      window.GlobalPlugin.toast.success('当天记录已删除')
    } catch (error) {
      console.error('删除当天记录失败:', error)
      window.GlobalPlugin.toast.error('删除当天记录失败')
    }
  }

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
    filteredCompletions,

    // 方法
    closeAddTaskModal,
    closeRemarkModal,
    handleCompleteTask,
    handleUncompleteTask,
    handleAddRemark,
    handleSaveRemark,
    handleEditTask,
    handleDeleteTask,
    handleSaveTask,
    handleUpdateOrder,
    handleDeleteCompletion,
    handleDeleteDateRecord,
    initialize,
  }
}

