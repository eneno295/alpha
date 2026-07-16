export type GridMode = 'arithmetic' | 'geometric' // 网格计价：等差（均匀价差）/ 等比（均匀比例）
export type MarginPositionMode = 'realtime' | 'total' // 保证金明细持仓口径：实时挂单量 / 总持仓

export type Tier = {
  cap: number // 该档持仓上限（币）；INF 表示无穷
  rate: number // 该档 MMR，小数形式（如 0.004 表示 0.4%）
}
export type SymbolConfig = {
  makerFeeRate: number // 挂单（Maker）费率，百分比数值，如 0.02 表示 0.02%
  takerFeeRate: number // 吃单（Taker）费率，百分比数值
  tiers: Tier[] // 按持仓规模分档的维持保证金率表
}
export type PlatformConfig = {
  label: string // 平台展示名
  reserveRate: number // 资金预留比例（%），不计入可用保证金的部分
  symbols: Record<string, SymbolConfig> // 各交易对费率与 MMR 分档
}
export type RiskConfig = Record<string, PlatformConfig> // 平台标识 → 该平台费率、预留率、交易对配置

export type ReserveRatePreset = {
  key: string // 与 riskConfig 平台 key 一致，用于快捷填充
  label: string // 按钮展示文案
  value: number // 预留率数值（%）
}

export type SimulationGroup = 'BTC' | 'ETH' | 'SOXL' // 模拟数据分组

export type SimulationPreset = {
  key: string // 预设唯一标识
  label: string // 界面按钮文案
  platformKey?: string // 应用预设时切换到的平台（可选）
  symbolKey?: string // 应用预设时切换到的币种（可选）
  values: {
    gridMode: GridMode // 等差或等比
    investAmount: number // 本金（USDT）
    multiplier: number // 策略倍数（杠杆名义）
    grids: number // 网格档数
    rangeLow: number // 策略价格区间下限（USDT）
    rangeHigh: number // 策略价格区间上限（USDT）
    estimatePrice: number // 用于保证金明细推进的预估现价（USDT）
    estimateGridDiff: number // 预估价格每移动一格的步长（USDT）
    dailyFilledGrids: number // 假设每日成交网格次数（用于估算日/月收益）
  }
}
export type SimulationPresetGroup = {
  group: SimulationGroup // 分组名（BTC / ETH / SOXL）
  presets: SimulationPreset[] // 该组下的模拟预设
}

export type MarginRow = {
  step: number // 第几格（步序号）
  price: string // 该档对应价位（格式化字符串）
  positionQty: string // 该价位下估算持仓数量（展示用，含单位文案）
  perGridMargin: string // 相对上一档新增的需追加保证金（USDT，格式化）
  cumulative: string // 从爆仓价到该档的累计需追加保证金（USDT，格式化）
}

export type ResultData = {
  qtyPerGridOut: string // 单网格持仓数量（币）
  totalQtyOut: string // 总持仓数量（币）
  avgGridPriceOut: string // 网格参考均价（USDT）
  notionalOut: string // 可用名义资金 / 总名义价值（USDT）
  leverageOut: string // 估算杠杆倍数（如 "9.42x"）
  liqPriceOut: string // 估算爆仓价（USDT）
  dailyProfitOut: string // 每日收益（USDT）及占本金比例
  monthlyProfitOut: string // 每月收益（USDT）及占本金比例（按 ×30）
  marginRows: MarginRow[] // 每格追加保证金明细表
  hint: string // 底部计算过程说明文案
}
