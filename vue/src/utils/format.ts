// 格式化数字，去除无用的0
export const formatNumber = (value: string | number | null): string => {
  if (!value) return '--'
  const num = parseFloat(value.toString())
  if (isNaN(num)) return value.toString()

  return num.toString()
}

// 格式化数字，处理精度问题
// 超过2位小数的保留2位，不超过的保持原样
export const formatDecimal = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'

  // 转换为字符串检查小数位数
  const numStr = num.toString()
  const decimalIndex = numStr.indexOf('.')

  // 如果没有小数部分，直接返回
  if (decimalIndex === -1) {
    return numStr
  }

  // 计算小数位数
  const decimalPlaces = numStr.length - decimalIndex - 1

  // 如果小数位数超过2位，保留2位；否则保持原样
  if (decimalPlaces > 2) {
    return num.toFixed(2)
  }

  return numStr
}

/** 安全转数字，非法值返回 0 */
export function toNum(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

/** 按 zh-CN 本地化格式化金额/比率等 */
export function formatLocaleNumber(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return '-'
  return v.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** USDT → 人民币固定汇率（结果面板展示切换用） */
export const USDT_CNY_RATE = 6.6

/**
 * 把已格式化的 USDT 金额文案按需换成人民币。
 * 支持纯数字（"1,234.56"）或带收益率后缀（"1,234.56（12.3%）"），只转换金额部分。
 */
export function toFiatText(usdtText: string, asCny: boolean): string {
  if (!asCny || !usdtText || usdtText === '-') return usdtText
  const idx = usdtText.indexOf('（')
  const money = idx >= 0 ? usdtText.slice(0, idx) : usdtText
  const suffix = idx >= 0 ? usdtText.slice(idx) : ''
  const n = Number(money.replace(/,/g, ''))
  if (!Number.isFinite(n)) return usdtText
  return `${formatLocaleNumber(n * USDT_CNY_RATE)}${suffix}`
}

// 格式化时间
export const formatTime = (timestamp: number, onlyDate: boolean = false): string => {
  const date = new Date(timestamp)
  if (onlyDate) {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
