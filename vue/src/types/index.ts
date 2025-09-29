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
  todayFastScore: number // 今日快速积分
  showMockScoreIcon: boolean // 是否显示模拟积分图标
  showThemeIcon: boolean // 是否显示主题图标
  showImportExportIcon: boolean // 是否显示导入导出图标
  showSimulationScore?: boolean // 是否显示模拟积分功能
  showFastConfig?: boolean // 是否显示快捷配置
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
    score: number // 积分
  }[] // 币种名称
  fee?: number // 手续费
  curScore?: number // 当前积分
  todayScore?: number // 今日积分
  consumptionScore?: number // 消耗积分
  remark?: string // 备注
}