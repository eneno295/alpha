import { useAppStore } from '@/stores/app'

/**
 * 计算前15天的净积分
 * @param targetDate 目标日期
 * @returns 前15天的净积分（刷的积分 - 消耗积分）
 */
export const calculatePrevious15DaysScore = (targetDate: string): number => {
  try {
    const store = useAppStore()
    const userData = store.currentUser
    if (!userData || !userData.date) return 0

    const dateData = userData.date
    const targetDateObj = new Date(targetDate)

    // 获取配置的刷的积分
    const configScore = store.currentConfig?.fastConfig?.todayScore || 0

    let totalEarnedScore = 0 // 前15天刷的积分总和
    let totalConsumedScore = 0 // 前15天扣的积分总和

    // 计算前15天的积分
    for (let i = 1; i <= 15; i++) {
      const checkDate = new Date(targetDateObj)
      checkDate.setDate(checkDate.getDate() - i)
      const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`

      // 查找该日期的记录
      const dayRecords = dateData.filter((item) => item.date === checkDateStr)

      if (dayRecords.length > 0) {
        // 有记录，累加刷的积分和扣的积分
        dayRecords.forEach((record) => {
          const earnedScore = Number(record.todayScore) || 0
          const consumedScore = Number(record.consumptionScore) || 0

          totalEarnedScore += earnedScore
          totalConsumedScore += consumedScore
        })
      } else {
        // 没有记录，使用配置的刷的积分
        totalEarnedScore += Number(configScore) || 0
      }
    }

    // 净积分 = 前15天刷的积分总和 - 前15天扣的积分总和
    const netScore = totalEarnedScore - totalConsumedScore

    // 检查积分是否合理
    if (netScore > 1000000) {
      return 0
    }

    return Math.max(0, netScore) // 积分不能为负数
  } catch (error) {
    console.error('计算前15天净积分时出错:', error)
    return 0
  }
}