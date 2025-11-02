// 任务相关类型定义

export interface TaskTemplate {
  id: number
  title: string
  description?: string
  category: 'daily' | 'duration' | 'deadline' // 每日、连续完成、到期完成
  sort: number
  bgColor?: string // 卡片背景颜色
  // 时间配置（仅限 duration 和 deadline 类型）
  startDate?: number // 开始日期（时间戳，当天0点）
  endDate?: number // 结束日期（时间戳，当天0点，仅限 duration 类型）
  deadlineDate?: number // 到期日期（时间戳，当天0点，仅限 deadline 类型）
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

