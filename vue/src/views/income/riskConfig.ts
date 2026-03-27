export type GridMode = 'arithmetic' | 'geometric'
export type MarginPositionMode = 'realtime' | 'total'
export type Tier = { cap: number; rate: number }
export type SymbolConfig = { makerFeeRate: number; takerFeeRate: number; tiers: Tier[] }
export type PlatformConfig = { label: string; symbols: Record<string, SymbolConfig> }
export type RiskConfig = Record<string, PlatformConfig>
export type ReserveRatePreset = { key: string; label: string; value: number }
export type SimulationPresetKey = 'btc5000' | 'eth5000' | 'eth2000' | 'eth1500'
export type SimulationPreset = {
  key: SimulationPresetKey
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

export const riskConfig: RiskConfig = {
  okx: {
    label: 'OKX',
    symbols: {
      ETH: {
        makerFeeRate: 0.02,
        takerFeeRate: 0.05,
        tiers: [
          { cap: 5000, rate: 0.4 },
          { cap: 10000, rate: 0.5 },
          { cap: 25000, rate: 0.75 },
          { cap: 50000, rate: 1.25 },
          { cap: 75000, rate: 1.75 },
          { cap: 100000, rate: 2.25 },
          { cap: 125000, rate: 2.75 },
          { cap: 150000, rate: 3.25 },
          { cap: 175000, rate: 3.75 },
          { cap: Infinity, rate: 4.25 },
        ],
      },
      BTC: {
        makerFeeRate: 0.02,
        takerFeeRate: 0.05,
        tiers: [
          { cap: 1000, rate: 0.4 },
          { cap: 5000, rate: 0.5 },
          { cap: 20000, rate: 0.75 },
          { cap: 40000, rate: 1.25 },
          { cap: 60000, rate: 1.75 },
          { cap: 80000, rate: 2.25 },
          { cap: 100000, rate: 2.75 },
          { cap: 120000, rate: 3.25 },
          { cap: 140000, rate: 3.75 },
          { cap: Infinity, rate: 4.25 },
        ],
      },
    },
  },
  binance: {
    label: 'Binance',
    symbols: {
      ETH: {
        makerFeeRate: 0.02,
        takerFeeRate: 0.05,
        tiers: [
          { cap: 5000, rate: 0.4 },
          { cap: 10000, rate: 0.5 },
          { cap: 25000, rate: 0.75 },
          { cap: 50000, rate: 1.25 },
          { cap: 75000, rate: 1.75 },
          { cap: 100000, rate: 2.25 },
          { cap: 125000, rate: 2.75 },
          { cap: 150000, rate: 3.25 },
          { cap: 175000, rate: 3.75 },
          { cap: Infinity, rate: 4.25 },
        ],
      },
    },
  },
  gate: {
    label: 'Gate',
    symbols: {
      ETH: {
        makerFeeRate: 0.02,
        takerFeeRate: 0.05,
        tiers: [
          { cap: 5000, rate: 0.4 },
          { cap: 10000, rate: 0.5 },
          { cap: 25000, rate: 0.75 },
          { cap: 50000, rate: 1.25 },
          { cap: 75000, rate: 1.75 },
          { cap: 100000, rate: 2.25 },
          { cap: 125000, rate: 2.75 },
          { cap: 150000, rate: 3.25 },
          { cap: 175000, rate: 3.75 },
          { cap: Infinity, rate: 4.25 },
        ],
      },
    },
  },
}

export function tiersToText(tiers: Tier[]): string {
  return tiers.map((tier) => `${Number.isFinite(tier.cap) ? tier.cap : 'INF'}:${tier.rate.toFixed(2)}`).join(',')
}

export const reserveRatePresets: ReserveRatePreset[] = [
  { key: 'okx', label: 'okx（5.76%）', value: 5.76 },
  { key: 'binance', label: 'binance（6%）', value: 6 },
  { key: 'gate', label: 'gate（7%）', value: 7 },
]

export const simulationPresets: SimulationPreset[] = [
  {
    key: 'btc5000',
    label: 'BTC 5000 / 70 / 10x',
    platformKey: 'okx',
    symbolKey: 'BTC',
    values: {
      investAmount: 5000,
      multiplier: 10,
      grids: 70,
      rangeLow: 40000,
      rangeHigh: 80000,
      estimatePrice: 40000,
      estimateGridDiff: 5000,
      dailyFilledGrids: 6,
    },
  },
  {
    key: 'eth5000',
    label: 'ETH 5000 / 70 / 10x',
    values: {
      investAmount: 5000,
      multiplier: 10,
      grids: 70,
      rangeLow: 1026,
      rangeHigh: 2426,
      estimatePrice: 1000,
      estimateGridDiff: 100,
      dailyFilledGrids: 8,
    },
  },
  {
    key: 'eth2000',
    label: 'ETH 2000 / 70 / 10x',
    values: {
      investAmount: 2000,
      multiplier: 10,
      grids: 70,
      rangeLow: 1026,
      rangeHigh: 2426,
      estimatePrice: 1000,
      estimateGridDiff: 100,
      dailyFilledGrids: 8,
    },
  },
  {
    key: 'eth1500',
    label: 'ETH 1500 / 30 / 10x',
    values: {
      investAmount: 1500,
      multiplier: 10,
      grids: 30,
      rangeLow: 1626,
      rangeHigh: 2226,
      estimatePrice: 1500,
      estimateGridDiff: 100,
      dailyFilledGrids: 8,
    },
  },
]
