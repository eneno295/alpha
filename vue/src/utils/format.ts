// 格式化数字，去除无用的0
export const formatNumber = (value: string | number | null): string => {
  if (!value) return '--'
  const num = parseFloat(value.toString())
  if (isNaN(num)) return value.toString()

  return num.toString()
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