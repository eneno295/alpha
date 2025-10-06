// 格式化数字，去除无用的0
export const formatNumber = (value: string | number | null): string => {
  if (!value) return '--'
  const num = parseFloat(value.toString())
  if (isNaN(num)) return value.toString()

  return num.toString()
}