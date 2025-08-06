// 应用数据类型定义

export interface ProfitData {
  users: string[] // 用户列表
  data: Record<string, UserData> // 用户数据映射
}

export interface ApiResponse {
  record: ProfitData // 数据记录
}

export interface UserData {
  config: UserConfig // 用户配置
  date: DateRecord[] // 日期记录列表
}

export interface UserConfig {
  userName: string // 用户名称
  theme: 'light' | 'dark' // 主题模式
  calendarDisplayMode: 'claimable' | 'score' // 日历显示模式
  todayFastScore: number // 今日快速积分
  showMockScoreIcon: boolean // 是否显示模拟积分图标
  showThemeIcon: boolean // 是否显示主题图标
  showCalendarDisplayModeIcon: boolean // 是否显示日历显示图标
  showImportExportIcon: boolean // 是否显示导入导出图标
}

export interface DateRecord {
  date: string // 日期字符串，格式：YYYY-MM-DD
  coin?: string // 币种名称
  amount?: number // 收益金额
  fee?: number // 手续费
  curScore?: number // 当前积分
  todayScore?: number // 今日积分
  ConsumptionScore?: number // 消耗积分
} 