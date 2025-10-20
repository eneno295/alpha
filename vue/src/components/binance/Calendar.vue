<template>
  <div class="calendar-container">
    <!-- 日历导航 -->
    <section class="calendar-nav">
      <div class="calendar-header">
        <button class="nav-arrow" @click="previousMonth">‹</button>
        <div class="center-content">
          <div class="month-year">{{ currentMonthYear }}</div>
          <div class="monthly-summary">
            项目 <span class="highlight">{{ monthlyProjects }}</span> 收入
            <span class="highlight income">{{ monthlyIncome.toFixed(1) }}</span> 手续费
            <span class="highlight fees">{{ monthlyFees.toFixed(1) }}</span> 利润
            <span class="highlight profit">{{ monthlyProfit.toFixed(1) }}</span>
          </div>
        </div>
        <button class="nav-arrow" @click="nextMonth">›</button>
      </div>
    </section>

    <!-- 日历网格 -->
    <section class="calendar-section">
      <div class="calendar-weekdays">
        <div class="weekday" v-for="weekday in weekdays" :key="weekday">
          {{ weekday }}
        </div>
      </div>
      <div class="calendar-grid">
        <div
          v-for="val in calendarDays"
          :key="val.key"
          :class="['calendar-day', val.className]"
          @click="handleDayClick(val)"
        >
          <div class="day-number">
            <div>{{ val.day }}</div>
            <!-- 15天加分提示 -->
            <div
              v-if="val.scoreGain && scoreDisplayMode === 'add'"
              class="score-data score-gain-data"
            >
              <span class="score-data-value">+{{ val.scoreGain.consumptionScore }}</span>
            </div>
            <!-- 刷的积分 -->
            <div
              v-else-if="val.dayData?.todayScore && scoreDisplayMode === 'today'"
              class="score-data"
            >
              <span class="score-data-value">{{ val.dayData?.todayScore }}</span>
            </div>
            <!-- 当前积分 -->
            <div
              v-else-if="val.dayData?.curScore && scoreDisplayMode === 'current'"
              class="score-data"
            >
              <span class="score-data-value">{{ val.dayData.curScore }}</span>
            </div>
            <!-- 模拟积分 -->
            <div
              v-if="
                appStore.binance.openSimulation && val.date && shouldShowSimulationScore(val.date)
              "
              class="simulation-score-data"
            >
              <span
                :class="[
                  'simulation-score-data-value',
                  shouldShowSimulationScore(val.date, true) ? 'hasData' : 'noData',
                ]"
                >{{ calculatePrevious15DaysScore(val.date) }}</span
              >
            </div>
          </div>

          <!-- 数据容器 -->
          <div class="day-data-container">
            <!-- 收益数据 -->
            <template v-if="val.dayData?.coin?.length > 0">
              <div v-for="coin in val.dayData.coin" :key="coin.name" class="day-data">
                {{ coin.name }}: {{ coin.amount }}
              </div>
            </template>

            <!-- 手续费数据 -->
            <div v-if="val.dayData?.fee" class="day-data fee-data">fee: {{ val.dayData.fee }}</div>
          </div>

          <!-- 积分信息提示框 -->
          <div class="simulation-tooltip">
            <!-- 15天加分提示 -->
            <template v-if="val.scoreGain && scoreDisplayMode === 'add'">
              <div class="tooltip-item">{{ val.scoreGain.date }}</div>
              <div class="tooltip-item" v-for="value in val.scoreGain.coin">
                {{ value.name }}: {{ value.amount }}
              </div>
              <div class="tooltip-item">fee：{{ val.scoreGain.fee || 0 }}</div>
            </template>
            <!-- 积分信息提示框 -->
            <template v-else>
              <template
                v-if="
                  appStore.binance.openSimulation &&
                  val.date &&
                  shouldShowSimulationScore(val.date, true)
                "
              >
                <div class="tooltip-item">计算日期: {{ getDateRangeText(val.date) }}</div>
                <div class="tooltip-item">基于前15天计算</div>
              </template>
              <template v-else>
                <div class="tooltip-item">当前积分: {{ val.dayData?.curScore || 0 }}</div>
                <div class="tooltip-item">刷的积分: {{ val.dayData?.todayScore || 0 }}</div>
                <div class="tooltip-item">消耗积分: {{ val.dayData?.consumptionScore || 0 }}</div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- 添加记录弹窗 -->
    <AddRecordModal
      :visible="showAddRecordModal"
      :selectedDate="selectedDate"
      :isEditing="isEditing"
      @close="closeAddRecordModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { calculatePrevious15DaysScore } from '@/composables/useScoreCalculation'

// 获取 store
const appStore = useAppStore()

// 星期标签
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 当前日期状态
const currentDate = ref(new Date())

// 添加记录弹窗状态
const showAddRecordModal = ref(false)
const selectedDate = ref('')
const isEditing = ref(false)

// 计算当前月份年份显示
const currentMonthYear = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

// 计算月度统计数据
const monthlyStats = computed(() => {
  const userData = appStore.binance.profitData
  if (!userData) return { projects: 0, income: 0, fees: 0, profit: 0 }

  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  let monthlyIncome = 0
  let monthlyProjects = 0
  let monthlyFees = 0

  userData.forEach((item: any) => {
    if (item.date?.startsWith(monthStr)) {
      // 统计 coin 数据
      if (item.coin && item.coin.length > 0) {
        ;(item.coin as unknown as any[]).forEach((coin: any) => {
          if (coin.name && coin.amount > 0) {
            monthlyIncome += coin.amount
            monthlyProjects += 1
          }
        })
      }
      // 统计手续费
      monthlyFees += item.fee || 0
    }
  })

  return {
    projects: monthlyProjects,
    income: monthlyIncome,
    fees: monthlyFees,
    profit: monthlyIncome - monthlyFees,
  }
})

const monthlyProjects = computed(() => monthlyStats.value.projects)
const monthlyIncome = computed(() => monthlyStats.value.income)
const monthlyFees = computed(() => monthlyStats.value.fees)
const monthlyProfit = computed(() => monthlyStats.value.profit)
const scoreDisplayMode = computed(() => appStore.binance.scoreDisplayMode)

// 计算日历天数
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  // 当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 当月第一天是星期几
  const firstDayWeekday = firstDay.getDay()

  // 上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0)
  const prevMonthDays = firstDayWeekday

  const days: Array<{
    key: string // 键
    day: number // 天
    className: string // 类名
    date: string | null // 日期
    dayData: any | null // 日期数据
    scoreGain: any | null // 15天前的数据或分数
  }> = []

  // 添加上个月的日期
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay.getDate() - i
    days.push({
      key: `prev-${day}`,
      day,
      className: 'other-month',
      date: null,
      dayData: null,
      scoreGain: null,
    })
  }

  // 添加当月的日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = getDayData(dateStr)

    let className = ''
    if (dayData?.coin && dayData.coin.length > 0) className += ' has-data'
    if (dayData?.fee !== 0) className += ' has-fee'
    if (isToday(year, month, day)) className += ' today'

    // 检查是否应该显示加分提示
    const scoreGainInfo = shouldShowScoreGain(dateStr, dayData)

    days.push({
      key: `current-${day}`,
      day,
      className,
      date: dateStr,
      dayData: dayData,
      scoreGain: scoreGainInfo,
    })
  }

  // 计算需要填充的下个月日期
  const totalDays = prevMonthDays + lastDay.getDate()
  const totalRows = Math.ceil(totalDays / 7)
  let targetCells = totalRows <= 5 ? 35 : 42
  const nextMonthDays = targetCells - totalDays

  // 添加下个月的日期
  for (let day = 1; day <= nextMonthDays; day++) {
    days.push({
      key: `next-${day}`,
      day,
      className: 'other-month',
      date: null,
      dayData: null,
      scoreGain: null,
    })
  }

  return days
})

// 获取某天的数据
const getDayData = (dateStr: string) => {
  const userData = appStore.binance.profitData
  if (!userData) return null

  const dayData = userData.find((item: any) => item.date === dateStr)

  // 如果没有找到数据，返回一个默认对象，而不是 null
  if (!dayData) {
    return {
      coin: [],
      fee: 0,
      curScore: 0,
      todayScore: 0,
      consumptionScore: 0,
      remark: null,
    }
  }

  return dayData
}

// 检查某天是否应该显示加分提示
const shouldShowScoreGain = (dateStr: string, dayData: any) => {
  const userData = appStore.binance.profitData
  if (!userData) return null

  // 计算15天前的日期
  const currentDate = new Date(dateStr)
  const fifteenDaysAgo = new Date(currentDate)
  fifteenDaysAgo.setDate(currentDate.getDate() - 15)
  const fifteenDaysAgoStr = fifteenDaysAgo.toISOString().split('T')[0]

  // 查找15天前是否有抢过空投（有 coin 数据）
  const fifteenDaysAgoData = userData.find((item: any) => item.date === fifteenDaysAgoStr)

  if (fifteenDaysAgoData?.coin && fifteenDaysAgoData.coin.length > 0) {
    // 如果15天前抢过空投，返回那天的完整数据
    return fifteenDaysAgoData
  }

  return null
}

// 检查是否是今天
const isToday = (year: number, month: number, day: number) => {
  const today = new Date()
  return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
}

// 月份导航
const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

// 日期点击处理
const handleDayClick = (day: any) => {
  if (day.date && !day.className.includes('other-month')) {
    openAddRecordModal(day.date)
  }
}

// 添加记录弹窗方法
const openAddRecordModal = (date: string) => {
  selectedDate.value = date
  // 检查该日期是否有数据，有数据就是编辑模式，没有数据就是新建模式
  const dayData = getDayData(date)
  const hasData = Boolean(
    dayData &&
      ((dayData.coin && dayData.coin.length > 0) ||
        dayData.curScore ||
        dayData.todayScore ||
        dayData.fee ||
        dayData.consumptionScore ||
        dayData.remark),
  )
  isEditing.value = hasData
  showAddRecordModal.value = true
}

const closeAddRecordModal = () => {
  showAddRecordModal.value = false
  selectedDate.value = ''
  isEditing.value = false
}

// 检查是否应该显示模拟积分
const shouldShowSimulationScore = (dateStr: string | null, isTooltip: boolean = false) => {
  if (!dateStr || !appStore.binance.openSimulation) return false

  const userData = appStore.binance.profitData
  if (!userData) return false

  // 检查该日期是否已有当前积分记录
  const hasCurScoreRecord = isTooltip
    ? userData.some(
        (item: any) =>
          item.date === dateStr && (item.todayScore || item.consumptionScore || item.fee || 0) > 0,
      )
    : userData.some((item: any) => item.date === dateStr && (item.curScore || 0) > 0)

  // 如果没有当前积分记录，显示模拟积分
  return !hasCurScoreRecord
}

// 获取前15天的日期范围文字
const getDateRangeText = (targetDate: string) => {
  try {
    const targetDateObj = new Date(targetDate)
    const endDate = new Date(targetDateObj)
    endDate.setDate(endDate.getDate() - 1) // 前一天
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 14) // 再往前14天

    const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`
    const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`

    return `${startStr}-${endStr}`
  } catch (error) {
    return '前15天'
  }
}
</script>

<style lang="scss" scoped>
.calendar-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
  overflow-x: hidden;
}

/* 日历导航 */
.calendar-nav {
  padding: 12px 16px;
  background: var(--bg-primary);

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .month-year {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .monthly-summary {
      font-size: 12px;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.4;

      .highlight {
        font-weight: 600;
        margin: 0 2px;
        color: var(--primary);

        &.income {
          color: var(--success);
        }
        &.fees {
          color: var(--error);
        }
        &.profit {
          color: var(--warning);
        }
      }
    }
  }

  .nav-arrow {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    width: 32px;
    height: 32px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: var(--primary);
      color: white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* 日历网格 */
.calendar-section {
  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    padding: 16px 0;
    min-width: 280px;
    background: var(--bg-secondary);

    .weekday {
      text-align: center;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 14px;
    }
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    min-width: 280px;
    background: var(--border-color);

    .calendar-day {
      border: none;
      padding: 8px 4px 2px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      background: var(--bg-primary);
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;

      &:hover:not(.other-month) {
        background: var(--bg-secondary);
        z-index: 1;
      }

      &.other-month {
        opacity: 0.5;
        cursor: default;
        background: var(--other-month-bg);
      }

      &.today {
        border-top: 4px solid var(--primary);
        position: relative;
        box-shadow:
          0 0px 7px rgba(59, 130, 246, 0.5),
          0 1px 1px rgba(0, 0, 0, 0.1);
      }

      &.has-data {
        background: #10b981;
        color: white;
        box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);

        &:hover {
          background: #10b981;
          opacity: 0.9;
        }
        .day-number {
          color: white;
        }
      }

      &:nth-child(-n + 7) {
        .simulation-tooltip {
          top: 110%;
          bottom: auto;
          &::after {
            top: auto;
            bottom: 100%;
            border-color: transparent transparent rgba(0, 0, 0, 0.9) transparent;
          }
        }
      }

      .day-number {
        font-weight: 700;
        margin-bottom: 4px;
        color: var(--text-primary);
        font-size: 14px;
        align-self: flex-start;
        display: flex;
        justify-content: space-between;
        width: 100%;

        .has-data & {
          color: white;
        }

        .score-data {
          color: var(--primary);
          font-weight: 600;
          font-size: 12px;
          .score-data-value {
            background: rgba(255, 255, 255, 0.9);
            padding: 1px 2px;
            border-radius: 2px;
          }
        }

        .score-gain-data {
          color: var(--success);
          font-size: 14px;
        }

        .simulation-score-data {
          .simulation-score-data-value {
            color: white;
            padding: 1px 2px;
            border-radius: 2px;
            font-weight: 600;
            font-size: 12px;
            &.hasData {
              background: rgba(255, 193, 7, 0.9);
            }
            &.noData {
              background: var(--primary);
            }
          }
        }
      }

      .day-data-container {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;

        .day-data {
          font-size: 14px;
          border-radius: 0;
          background: transparent;
          line-height: 1.2;
          word-break: break-all;
          text-align: right;

          &.fee-data {
            color: var(--error);
          }

          .has-data & {
            color: white;
          }
        }
      }

      /* 积分信息提示框 */
      .simulation-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
        margin-bottom: 10px;
        max-width: 200px;
        word-break: break-all;
        text-align: left;

        &::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
        }

        .tooltip-item {
          white-space: nowrap;
        }
      }

      &:hover:not(.other-month) .simulation-tooltip {
        opacity: 1;
        visibility: visible;
      }
    }
  }
}

/* 简化的响应式设计 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 0;
  }

  .main-title {
    display: none;
  }
}
</style>
