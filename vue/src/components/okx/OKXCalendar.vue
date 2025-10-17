<template>
  <div class="okx-calendar">
    <div class="calendar-container">
      <!-- 日历导航 -->
      <section class="calendar-nav">
        <div class="calendar-header">
          <button class="nav-arrow" @click="previousMonth">‹</button>
          <div class="center-content">
            <div class="month-year">{{ currentMonthYear }}</div>
            <div class="monthly-summary">
              空投 <span class="highlight">{{ monthlyProjects }}</span> 收入
              <span class="highlight income">{{ monthlyIncome.toFixed(1) }}</span> 手续费
              <span class="highlight fees">{{ monthlyFees.toFixed(1) }}</span> 总收入
              <span class="highlight profit">{{ monthlyTotal.toFixed(1) }}</span>
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
            </div>

            <!-- 数据容器 -->
            <div class="day-data-container">
              <!-- 空投数据 -->
              <template v-if="val.dayData?.coin?.length > 0">
                <div
                  v-for="coin in val.dayData.coin"
                  :key="coin.name"
                  class="day-data airdrop-data"
                >
                  {{ coin.name }}: {{ coin.amount }}
                </div>
              </template>

              <!-- 手续费数据 -->
              <div v-if="val.dayData?.fee" class="day-data fee-data">
                fee: {{ val.dayData.fee }}
              </div>
            </div>

            <!-- 信息提示框 -->
            <div class="info-tooltip">
              <div class="tooltip-item">日期: {{ val.date }}</div>
              <template v-if="val.dayData?.coin?.length > 0">
                <div class="tooltip-item" v-for="coin in val.dayData.coin" :key="coin.name">
                  {{ coin.name }}: {{ coin.amount }}
                </div>
              </template>
              <div class="tooltip-item">手续费：{{ val.dayData?.fee || 0 }}</div>
              <div class="tooltip-item">
                总收入：{{
                  (val.dayData?.fee || 0) +
                  (val.dayData?.coin?.reduce((sum: number, coin: any) => sum + coin.amount, 0) || 0)
                }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'

// 使用 store
const store = useAppStore()

// 星期标签
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 当前日期状态
const currentDate = ref(new Date())

// 计算当前月份年份显示
const currentMonthYear = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

// 计算月度统计数据
const monthlyStats = computed(() => {
  const userData = store.currentUser
  if (!userData?.okx?.date) return { projects: 0, income: 0, fees: 0, total: 0 }

  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  let monthlyIncome = 0
  let monthlyProjects = 0
  let monthlyFees = 0

  userData.okx.date.forEach((item: any) => {
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
    total: monthlyIncome + monthlyFees,
  }
})

const monthlyProjects = computed(() => monthlyStats.value.projects)
const monthlyIncome = computed(() => monthlyStats.value.income)
const monthlyFees = computed(() => monthlyStats.value.fees)
const monthlyTotal = computed(() => monthlyStats.value.total)

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
    })
  }

  // 添加当月的日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = getDayData(dateStr)

    let className = ''
    if (dayData?.coin && dayData.coin.length > 0) className += ' has-airdrop'
    if (dayData?.fee !== 0) className += ' has-fee'
    if (isToday(year, month, day)) className += ' today'

    days.push({
      key: `current-${day}`,
      day,
      className,
      date: dateStr,
      dayData: dayData,
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
    })
  }

  return days
})

// 获取某天的数据
const getDayData = (dateStr: string) => {
  const userData = store.currentUser
  if (!userData?.okx?.date) return null

  const dayData = userData.okx.date.find((item: any) => item.date === dateStr)

  // 如果没有找到数据，返回一个默认对象，而不是 null
  if (!dayData) {
    return {
      coin: [],
      fee: 0,
      remark: null,
    }
  }

  return dayData
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

// 定义事件
const emit = defineEmits<{
  openModal: [date: string]
}>()

// 日期点击处理
const handleDayClick = (day: any) => {
  if (day.date && !day.className.includes('other-month')) {
    emit('openModal', day.date)
  }
}
</script>

<style lang="scss" scoped>
.okx-calendar {
  padding: 0 18px;
  // 日历容器
  .calendar-container {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    overflow-x: hidden;
    position: relative;
    z-index: 1;
  }
}

// 日历导航
.calendar-nav {
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .month-year {
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      .monthly-summary {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        text-align: center;
        line-height: 1.6;
        background: rgba(255, 255, 255, 0.05);
        padding: 8px 16px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);

        .highlight {
          font-weight: 700;
          margin: 0 4px;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);

          &.income {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
          }
          &.fees {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
          }
          &.profit {
            background: rgba(245, 158, 11, 0.2);
            color: #fbbf24;
          }
        }
      }
    }

    .nav-arrow {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      width: 48px;
      height: 48px;
      border-radius: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

/* 日历网格 */
.calendar-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    padding: 0 0 16px 0;
    margin-bottom: 10px;

    .weekday {
      text-align: center;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      padding: 12px 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;

    .calendar-day {
      border: none;
      padding: 12px 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      min-height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);

      &:hover:not(.other-month) {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 1;
      }

      &.other-month {
        opacity: 0.3;
        cursor: default;
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.05);
      }

      &.today {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
        border-color: rgba(59, 130, 246, 0.5);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      }

      &.has-airdrop {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
        border-color: rgba(34, 197, 94, 0.5);
        box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);

        &:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
          transform: translateY(-2px) scale(1.02);
        }
        .day-number {
          color: #4ade80;
          font-weight: 700;
        }
      }

      &.has-fee {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));
        border-color: rgba(245, 158, 11, 0.5);
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);

        &:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3));
          transform: translateY(-2px) scale(1.02);
        }
        .day-number {
          color: #fbbf24;
          font-weight: 700;
        }
      }

      &:nth-child(-n + 7) {
        .info-tooltip {
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
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        align-self: flex-start;
        display: flex;
        justify-content: space-between;
        width: 100%;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .day-data-container {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;

        .day-data {
          font-size: 11px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          margin: 1px 0;
          line-height: 1.2;
          word-break: break-all;
          text-align: right;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);

          &.fee-data {
            color: #fbbf24;
            background: rgba(245, 158, 11, 0.2);
            border-color: rgba(245, 158, 11, 0.3);
          }

          &.airdrop-data {
            color: #4ade80;
            background: rgba(34, 197, 94, 0.2);
            border-color: rgba(34, 197, 94, 0.3);
          }
        }
      }

      /* 信息提示框 */
      .info-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
        margin-bottom: 12px;
        max-width: 250px;
        word-break: break-all;
        text-align: left;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

        &::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 8px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.95) transparent transparent transparent;
        }

        .tooltip-item {
          white-space: nowrap;
          margin: 2px 0;
          padding: 2px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          &:last-child {
            border-bottom: none;
          }
        }
      }

      &:hover:not(.other-month) .info-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-4px);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-nav {
    padding: 16px;
    border-radius: 16px;

    .calendar-header {
      .center-content {
        gap: 8px;
      }

      .month-year {
        font-size: 20px;
      }

      .monthly-summary {
        font-size: 12px;
        padding: 6px 12px;
      }
    }

    .nav-arrow {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }
  }

  .calendar-section {
    padding: 16px;
    border-radius: 16px;

    .calendar-weekdays {
      gap: 4px;
      margin-bottom: 12px;

      .weekday {
        padding: 8px 4px;
        font-size: 12px;
      }
    }

    .calendar-grid {
      gap: 4px;

      .calendar-day {
        padding: 8px 4px;
        min-height: 80px;
        border-radius: 8px;

        .day-number {
          font-size: 14px;
          margin-bottom: 6px;
        }

        .day-data {
          font-size: 10px;
          padding: 1px 4px;
        }
      }
    }
  }
}

// 小屏幕适配
@media (max-width: 480px) {
  .calendar-container {
    .calendar-nav {
      padding: 8px;

      .calendar-header {
        gap: 8px;

        .center-content {
          .month-year {
            font-size: 18px;
          }

          .monthly-summary {
            font-size: 12px;
            padding: 6px 12px;
          }
        }

        .nav-arrow {
          width: 36px;
          height: 36px;
          font-size: 16px;
        }
      }
    }

    .calendar-section {
      padding: 8px;

      .calendar-weekdays {
        .weekday {
          font-size: 12px;
          padding: 8px 2px;
        }
      }

      .calendar-grid {
        .calendar-day {
          min-height: 60px;
          padding: 4px 1px;

          .day-number {
            font-size: 11px;
          }

          .day-data {
            font-size: 8px;
            padding: 1px 2px;
          }
        }
      }
    }
  }
}
</style>
