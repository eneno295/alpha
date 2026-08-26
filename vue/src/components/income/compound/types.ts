export type Frequency = 'year' | 'quarter' | 'month' | 'day'

export type YearRow = {
  year: number
  invested: string
  profit: string
  balance: string
}

export type ResultView = {
  finalBalanceOut: string
  totalInvestedOut: string
  totalProfitOut: string
  totalRoiOut: string
  yearRows: YearRow[]
  hint?: string
}

export type FrequencyOption = {
  value: Frequency
  label: string
  periods: number
}
