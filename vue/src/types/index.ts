// 应用数据类型定义

export interface ProfitData {
  users: string[] // 用户列表
  data: Record<string, UserData> // 用户数据映射
}

export interface ApiResponse {
  record: ProfitData // 数据记录
}

export interface UserData {
  config: Config // 用户配置
  binance: {
    config: platformConfig // Binance 配置
    date: DateRecord[] // 日期记录列表
    log?: LogEntry[] // 操作日志
  }
  okx: {
    config: platformConfig // OKX 配置
    accounts: Record<string, {
      date: DateRecord[] // 每个账号的日期记录列表
      order: number // 账号排序序号
    }> // 按账号分组的数据
    log?: LogEntry[] // 操作日志
  }
  gate?: {
    config: platformConfig // Gate 配置
    date: DateRecord[] // 日期记录列表
    log?: LogEntry[] // 操作日志
  }
  tasks?: TaskData // 任务数据
}

export interface Config {
  userName: string // 用户名称
  showOKXLink: boolean // 是否显示OKX链接
}

export interface platformConfig {
  theme?: 'light' | 'dark' // 主题模式
  showMockScoreIcon?: boolean // 是否显示模拟积分图标
  showThemeIcon: boolean // 是否显示主题图标
  showImportExportIcon: boolean // 是否显示导入导出图标
  showSimulationScore?: boolean // 是否显示模拟积分功能
  showFastConfig?: boolean // 是否显示快捷配置
  showClearLogs?: boolean // 是否显示清空日志按钮
  fastConfig?: {
    fee: string // 手续费
    todayScore: string // 今日积分
    autoCalcCurScore: boolean // 自动计算当前积分
  } // 快捷配置
}

export interface DateRecord {
  date: string // 日期字符串，格式：YYYY-MM-DD
  coin?: {
    name: string // 币种名称
    amount: number // 收益金额
    score?: number // 积分（可选，OKX 不需要）
  }[] // 币种名称
  fee?: number // 手续费
  curScore?: number // 当前积分
  todayScore?: number // 今日积分
  consumptionScore?: number // 消耗积分
  remark?: string // 备注
}

export type LogType =
  | 'addRecord'
  | 'editRecord'
  | 'clearRecord'
  | 'editConfigs'
  | 'editConfig'
  | 'editAccounts'
  | 'addAccounts'
  | 'delAccounts'
  | 'orderAccounts'
  | 'renameAccounts'

export interface LogEntry {
  id: number // 日志ID
  timestamp: number // 时间戳
  action: string // 操作类型
  details?: string // 操作详情
  ip: string // IP 地址
  type: LogType // 操作类型
}

export interface AddLog {
  action: string // 操作类型
  type: LogType // 操作类型
  details?: string // 操作详情
}

export type Platform = 'binance' | 'okx' | 'gate'

// 任务相关类型
export interface TaskTemplate {
  id: number
  title: string
  description?: string
  category: 'daily' | 'weekly' | 'monthly' | 'custom'
  sort: number
  bgColor?: string // 卡片背景颜色
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

export interface TaskData {
  tasks: TaskTemplate[]
  date: TaskDateRecord[]
}