import { formatLocaleNumber, toNum } from '@/utils/format'

export type ProfitLot = {
  currentPrice: number
  costAmount: number
}

export type ProfitLotRow = {
  index: number
  qtyOut: string
  costOut: string
  avgPriceOut: string
  profitOut: string
  profitPositive: boolean
}

export type ProfitResult = {
  qtyOut: string
  costTotalOut: string
  avgPriceOut: string
  sellTotalOut: string
  profitOut: string
  roiOut: string
  profitPositive: boolean | null
  lots: ProfitLotRow[]
  hint: string
}

export function calcProfit(lots: ProfitLot[], sellPriceInput: number): ProfitResult {
  const empty: ProfitResult = {
    qtyOut: '-',
    costTotalOut: '-',
    avgPriceOut: '-',
    sellTotalOut: '-',
    profitOut: '-',
    roiOut: '-',
    profitPositive: null,
    lots: [],
    hint: '每笔填写大于 0 的现价和购买总额，并填写卖出价格。',
  }

  const sellPrice = toNum(sellPriceInput)
  const valid = lots
    .map((lot, index) => ({
      index: index + 1,
      currentPrice: toNum(lot.currentPrice),
      costAmount: toNum(lot.costAmount),
    }))
    .filter((lot) => lot.currentPrice > 0 && lot.costAmount > 0)

  if (valid.length === 0 || sellPrice <= 0) return empty

  const qty = valid.reduce((sum, lot) => sum + lot.costAmount / lot.currentPrice, 0)
  const costTotal = valid.reduce((sum, lot) => sum + lot.costAmount, 0)
  const avgPrice = costTotal / qty
  const sellTotal = qty * sellPrice
  const profit = sellTotal - costTotal
  const roi = profit / costTotal

  return {
    qtyOut: formatLocaleNumber(qty, 6),
    costTotalOut: formatLocaleNumber(costTotal),
    avgPriceOut: formatLocaleNumber(avgPrice),
    sellTotalOut: formatLocaleNumber(sellTotal),
    profitOut: formatLocaleNumber(profit),
    roiOut: `${formatLocaleNumber(roi * 100)}%`,
    profitPositive: profit >= 0,
    lots: valid.map((lot) => {
      const qtyLot = lot.costAmount / lot.currentPrice
      const profitLot = qtyLot * sellPrice - lot.costAmount
      return {
        index: lot.index,
        qtyOut: formatLocaleNumber(qtyLot, 6),
        costOut: formatLocaleNumber(lot.costAmount),
        avgPriceOut: formatLocaleNumber(lot.currentPrice),
        profitOut: formatLocaleNumber(profitLot),
        profitPositive: profitLot >= 0,
      }
    }),
    hint: `持仓数量 = 各笔购买总额 / 现价之和；持仓均价 = 购买总额合计 / 持仓数量；卖出总额 = 持仓数量 × 卖出价格；收益 = 卖出总额 - 购买总额合计。`,
  }
}
