// 任务相关类型定义

export interface TaskTemplate {
  id: number
  title: string
  description?: string
  category: 'daily' | 'weekly' | 'monthly' | 'custom'
  sort: number
  bgColor?: string // 卡片背景颜色
  // 自定义任务的时间配置
  taskDurationType?: 'deadline' | 'duration' // 到期天数 或 持续天数
  taskDays?: number // 天数
  startDate?: number // 开始日期（时间戳，用于计算到期日）
}

export interface DailyTaskItem {
  taskId: number
  completedAt?: number  // 时间戳
  remark?: string
  detail: TaskTemplate  // 任务详情快照
}

export interface TaskDateRecord {
  id: number
  date: number  // 时间戳（当天0点）
  tasks: DailyTaskItem[]
}

export interface TaskConfig {
  showDeleteTask?: boolean // 是否显示删除任务按钮
}

export interface TaskData {
  config?: TaskConfig // 任务配置
  tasks: TaskTemplate[]
  date: TaskDateRecord[]
}

