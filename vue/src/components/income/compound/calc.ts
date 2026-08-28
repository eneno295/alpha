import { formatLocaleNumber, toNum } from '@/utils/format'
import type { Frequency, FrequencyOption, ResultView, YearRow } from './types'

export const frequencyOptions: FrequencyOption[] = [
  { value: 'day', label: '日', periods: 365 },
  { value: 'month', label: '月', periods: 12 },
  { value: 'quarter', label: '季', periods: 4 },
  { value: 'year', label: '年', periods: 1 },
]

/** 供 SegmentTabs 使用的频率选项 */
export const frequencyTabs = frequencyOptions.map((opt) => ({
  key: opt.value,
  label: opt.label,
}))

export function getPeriodsPerYear(frequency: Frequency): number {
  return frequencyOptions.find((opt) => opt.value === frequency)?.periods ?? 1
}

export function getFrequencyLabel(frequency: Frequency): string {
  return frequencyOptions.find((opt) => opt.value === frequency)?.label ?? '期'
}

export function emptyResult(hint = ''): ResultView {
  return {
    finalBalanceOut: '-',
    totalInvestedOut: '-',
    totalProfitOut: '-',
    totalRoiOut: '-',
    yearRows: [],
    hint,
  }
}

/** 本金 + 定期定投复利（完整计算） */
export function calcWithContribution(input: {
  principal: number
  annualRate: number
  years: number
  contribution: number
  frequency: Frequency
}): ResultView {
  const principal = Math.max(0, toNum(input.principal))
  const annualRate = toNum(input.annualRate)
  const years = Math.floor(toNum(input.years))
  const contribution = toNum(input.contribution)
  const periodsPerYear = getPeriodsPerYear(input.frequency)
  const freqLabel = getFrequencyLabel(input.frequency)

  if (years <= 0 || (principal <= 0 && contribution <= 0)) {
    return emptyResult('提示：投资年数需大于 0，且初始本金或每期定投至少一项大于 0。')
  }

  const periodicRate = annualRate / 100 / periodsPerYear
  const yearRows: YearRow[] = []
  let balance = principal

  for (let y = 1; y <= years; y += 1) {
    const startBalance = balance
    for (let p = 0; p < periodsPerYear; p += 1) {
      balance = balance * (1 + periodicRate) + contribution
    }
    const investedThisYear = contribution * periodsPerYear
    yearRows.push({
      year: y,
      invested: formatLocaleNumber(investedThisYear),
      profit: formatLocaleNumber(balance - startBalance - investedThisYear),
      balance: formatLocaleNumber(balance),
    })
  }

  const totalInvested = principal + contribution * periodsPerYear * years
  const totalProfit = balance - totalInvested
  const totalRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  return {
    finalBalanceOut: formatLocaleNumber(balance),
    totalInvestedOut: formatLocaleNumber(totalInvested),
    totalProfitOut: formatLocaleNumber(totalProfit),
    totalRoiOut: `${formatLocaleNumber(totalRoi)}%`,
    yearRows,
    hint:
      `复利计算：本金=${formatLocaleNumber(principal)}，年化=${formatLocaleNumber(annualRate)}%，按${freqLabel}复利` +
      `（每期利率=${formatLocaleNumber(periodicRate * 100, 4)}%），每期定投=${formatLocaleNumber(contribution)}，共 ${years} 年。`,
  }
}

/** 无定投复利：按频率复利，按年输出曲线点与结果面板数据 */
export function calcNoContribution(input: {
  principal: number
  annualRate: number
  years: number
  frequency: Frequency
}): {
  result: ResultView
  points: { x: number; y: number }[]
  fv: number
  periodicRate: number
  totalPeriods: number
  periodsPerYear: number
  freqLabel: string
  principal: number
  years: number
} {
  const principal = Math.max(0, toNum(input.principal))
  const annualRate = Math.max(0, toNum(input.annualRate))
  const years = Math.max(1, Math.min(40, Math.floor(toNum(input.years)) || 1))
  const periodsPerYear = getPeriodsPerYear(input.frequency)
  const freqLabel = getFrequencyLabel(input.frequency)
  const periodicRate = annualRate / 100 / periodsPerYear
  const totalPeriods = years * periodsPerYear

  const balanceAtYear = (y: number) =>
    principal * Math.pow(1 + periodicRate, y * periodsPerYear)

  const fv = balanceAtYear(years)

  // 按复利期生成曲线点（最多 ~120 个点），拖动参数时曲线会实时变化
  const points: { x: number; y: number }[] = []
  const pointStep = Math.max(1, Math.ceil(totalPeriods / 120))
  for (let p = 0; p <= totalPeriods; p += pointStep) {
    const balance = principal * Math.pow(1 + periodicRate, p)
    points.push({ x: p / periodsPerYear, y: balance })
  }
  if (points[points.length - 1]?.x !== years) {
    points.push({ x: years, y: fv })
  }

  const yearRows: YearRow[] = []
  for (let y = 1; y <= years; y += 1) {
    const start = balanceAtYear(y - 1)
    const end = balanceAtYear(y)
    yearRows.push({
      year: y,
      invested: formatLocaleNumber(0),
      profit: formatLocaleNumber(end - start),
      balance: formatLocaleNumber(end),
    })
  }

  const totalProfit = fv - principal
  const totalRoi = principal > 0 ? (totalProfit / principal) * 100 : 0

  return {
    result: {
      finalBalanceOut: formatLocaleNumber(fv),
      totalInvestedOut: formatLocaleNumber(principal),
      totalProfitOut: formatLocaleNumber(totalProfit),
      totalRoiOut: `${formatLocaleNumber(totalRoi)}%`,
      yearRows,
    },
    points,
    fv,
    periodicRate,
    totalPeriods,
    periodsPerYear,
    freqLabel,
    principal,
    years,
  }
}
