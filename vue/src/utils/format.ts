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

// 格式化时间
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}