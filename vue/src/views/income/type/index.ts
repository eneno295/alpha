export type GridMode = 'arithmetic' | 'geometric'
export type MarginPositionMode = 'realtime' | 'total'

export type Tier = { cap: number; rate: number }
export type SymbolConfig = { makerFeeRate: number; takerFeeRate: number; tiers: Tier[] }
export type PlatformConfig = { label: string; symbols: Record<string, SymbolConfig> }
export type RiskConfig = Record<string, PlatformConfig>

export type ReserveRatePreset = { key: string; label: string; value: number }
export type SimulationPreset = {
  key: string
  label: string
  platformKey?: string
  symbolKey?: string
  values: {
    investAmount: number
    multiplier: number
    grids: number
    rangeLow: number
    rangeHigh: number
    estimatePrice: number
    estimateGridDiff: number
    dailyFilledGrids: number
  }
}

export type MarginRow = {
  step: number
  price: string
  positionQty: string
  perGridMargin: string
  cumulative: string
}

export type ResultData = {
  qtyPerGridOut: string
  totalQtyOut: string
  avgGridPriceOut: string
  notionalOut: string
  leverageOut: string
  liqPriceOut: string
  dailyProfitOut: string
  monthlyProfitOut: string
  marginRows: MarginRow[]
  hint: string
}
