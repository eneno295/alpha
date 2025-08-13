<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { fetchDataFromAPI } from '@/api'
import type { ProfitData, DateRecord } from '@/types'
import Header from '@/components/profit/Header.vue'
import ImportExportModal from '@/components/profit/ImportExportModal.vue'
import AddRecordModal from '@/components/profit/AddRecordModal.vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import { useToast } from '@/composables/useToast'

// 加载状态管理
const { showLoadingState, hideLoadingState } = useLoading()

// 获取 store
const store = useAppStore()

// 获取 Toast 服务
const { showSuccessMessage } = useToast()

const initializeApp = async () => {
  // 显示加载状态
  showLoadingState()

  try {
    // 从API获取数据
    const data = await fetchDataFromAPI()
    store.setProfitData(data)
    // 初始化当前用户数据
    store.initializeCurrentUser()
  } catch (error) {
    console.error('数据加载失败:', error)
  }

  // 应用用户配置
  // applyUserConfig();

  // updateThemeIcon();
  // updateCalendarDisplayIcon();

  // 更新用户显示和配置可见性
  updateUserDisplay()
  updateConfigVisibility()

  // // 渲染日历
  // renderCalendar();

  // // 更新统计数据
  // updateStats();

  // // 更新每日摘要
  // updateDailySummary();

  // // 绑定事件监听器
  // bindEventListeners();

  // // 初始化箭头状态
  // updateArrowStates();

  // 隐藏加载状态
  hideLoadingState()
}

// 更新用户显示
const updateUserDisplay = () => {
  // 重新初始化当前用户数据
  store.initializeCurrentUser()

  // 更新配置开关显示状态
  updateConfigVisibility()

  // 重新渲染日历
  // 更新统计数据
  // 更新每日摘要
}

// 更新配置开关的显示状态
const updateConfigVisibility = () => {
  const userData = store.currentUser
  if (!userData || !userData.config) return

  const config = userData.config

  // 主题切换按钮
  const themeBtn = document.querySelector('.icon-btn[title="切换主题"]') as HTMLElement
  if (themeBtn) {
    themeBtn.style.display = config.showThemeIcon === true ? 'block' : 'none'
  }

  // 日历显示切换按钮
  const calendarDisplayBtn = document.querySelector(
    '.icon-btn[title="切换日历显示模式"]',
  ) as HTMLElement
  if (calendarDisplayBtn) {
    calendarDisplayBtn.style.display =
      config.showCalendarDisplayModeIcon === true ? 'block' : 'none'
  }

  // 导入导出按钮
  const importExportBtn = document.querySelector('.icon-btn[title="导入导出"]') as HTMLElement
  if (importExportBtn) {
    importExportBtn.style.display = config.showImportExportIcon === true ? 'block' : 'none'
  }
}

// 页面逻辑
onMounted(() => {
  initializeApp()

  // 監聽打開導入導出模態框事件
  window.addEventListener('openImportExportModal', () => {
    showImportExportModal.value = true
  })

  // 監聽用戶切換事件
  window.addEventListener('userChanged', (event) => {
    const userId = (event as CustomEvent).detail
    // 更新用戶顯示和配置可見性
    updateUserDisplay()
    updateConfigVisibility()
  })
})

//日历
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDate = ref(new Date())

// 模態框狀態
const showImportExportModal = ref(false)
const showAddRecordModal = ref(false)
const selectedDateForModal = ref('')
const existingRecordForModal = ref<DateRecord | undefined>()

const monthYear = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const dailySummary = computed(() => {
  const monthData = getMonthData()
  const projects = monthData.filter((record) => record.coin && (record.amount || 0) > 0).length
  const income = monthData.reduce((sum, record) => sum + (record.amount || 0), 0)
  const fees = monthData.reduce((sum, record) => sum + (record.fee || 0), 0)
  const profit = income - fees
  return `项目 ${projects} 收入 ${income.toFixed(1)} 手续费${fees.toFixed(1)} 利润 ${profit.toFixed(1)}`
})

const totalProjects = computed(() => {
  return (
    store.currentProfitData?.filter((record) => record.coin && (record.amount || 0) > 0).length || 0
  )
})

const totalIncome = computed(() => {
  return store.currentProfitData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0
})

const totalFees = computed(() => {
  return store.currentProfitData?.reduce((sum, record) => sum + (record.fee || 0), 0) || 0
})

const totalProfit = computed(() => {
  return totalIncome.value - totalFees.value
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const dateString = formatDate(date)
    const records = getRecordByDate(dateString)

    // 計算總收益和手續費
    const totalAmount = records.reduce((sum, record) => sum + (record.amount || 0), 0)
    const totalFee = records.reduce((sum, record) => sum + (record.fee || 0), 0)

    // 檢查是否有收益數據
    const hasData = records.some((record) => record.coin && (record.amount || 0) > 0)
    const hasFee = records.some((record) => (record.fee || 0) > 0)

    days.push({
      date: dateString,
      dayNumber: date.getDate(),
      isOtherMonth: date.getMonth() !== currentMonth.value,
      isToday: isToday(date),
      hasData,
      hasFee,
      amount: totalAmount,
      fee: totalFee,
      coin: '',
      records,
    })
  }
  return days
})

//檢查是否有下個月的數據
const hasNextMonthData = computed(() => {
  const nextMonthDate = new Date(currentYear.value, currentMonth.value + 1, 1)
  const year = nextMonthDate.getFullYear()
  const month = nextMonthDate.getMonth()

  const userData = store.currentProfitData || []
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  return userData.some((item) => item.date && item.date.startsWith(monthStr))
})

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function getMonthData(): DateRecord[] {
  if (!store.currentProfitData) return []

  return store.currentProfitData.filter((record) => {
    const recordDate = new Date(record.date)
    return (
      recordDate.getMonth() === currentMonth.value && recordDate.getFullYear() === currentYear.value
    )
  })
}

function getRecordByDate(dateString: string): DateRecord[] {
  return store.currentProfitData?.filter((record) => record.date === dateString) || []
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (!hasNextMonthData.value) {
    return
  }

  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function selectDate(day: any) {
  if (!day.isOtherMonth) {
    selectedDate.value = new Date(day.date)
    selectedDateForModal.value = day.date

    // 檢查是否已有記錄
    if (day.records && day.records.length > 0) {
      // 編輯模式：傳入該日期的所有記錄信息
      // 創建一個合併的記錄對象，包含所有空投信息
      const firstRecord = day.records[0]
      const allAirdrops = day.records
        .filter((record: DateRecord) => record.coin && (record.amount || 0) > 0)
        .map((record: DateRecord) => ({ coin: record.coin!, amount: record.amount || 0 }))

      existingRecordForModal.value = {
        ...firstRecord,
        // 添加一個臨時字段來存儲所有空投信息
        _allAirdrops: allAirdrops,
      }
    } else {
      // 新建模式
      existingRecordForModal.value = undefined
    }

    showAddRecordModal.value = true
    console.log('选择的日期:', day.date)
  }
}

// 保存記錄
async function saveRecord(record: DateRecord | DateRecord[]) {
  try {
    // 如果是數組，處理多個記錄
    if (Array.isArray(record)) {
      if (record.length === 0) return

      // 檢查是否為刪除操作
      if ('_isDelete' in record[0] && record[0]._isDelete) {
        // 刪除該日期的所有記錄
        if (!store.profitData || !store.profitData.data) {
          console.error('❌ profitData 或 data 不存在')
          return
        }

        // 找到當前用戶
        const currentUserId = Object.keys(store.profitData.data).find(
          (key) => store.profitData?.data[key] === store.currentUser,
        )

        if (!currentUserId) return

        // 移除該日期的所有記錄
        store.profitData.data[currentUserId].date = store.profitData.data[
          currentUserId
        ].date.filter((item) => item.date !== record[0].date)

        // 調用 API 保存數據
        const success = await store.updateData(store.profitData)

        if (success) {
          console.log('記錄刪除成功:', record[0].date)
          showSuccessMessage('✅ 記錄刪除成功！')
          // 重新初始化當前用戶數據
          store.initializeCurrentUser()
        } else {
          console.error('記錄刪除失敗')
        }

        return
      }

      // 處理多個記錄
      if (!store.profitData || !store.profitData.data) {
        console.error('❌ profitData 或 data 不存在')
        return
      }

      // 找到當前用戶
      const currentUserId = Object.keys(store.profitData.data).find(
        (key) => store.profitData?.data[key] === store.currentUser,
      )

      if (!currentUserId) return

      // 獲取第一個記錄的日期（所有記錄應該都是同一天）
      const targetDate = record[0].date

      // 移除該日期的所有舊記錄
      store.profitData.data[currentUserId].date = store.profitData.data[currentUserId].date.filter(
        (item) => item.date !== targetDate,
      )

      // 添加所有新記錄
      record.forEach((r) => {
        store.profitData.data[currentUserId].date.push(r)
      })

      // 調用 API 保存數據
      const success = await store.updateData(store.profitData)

      if (success) {
        console.log('記錄保存成功:', record)
        showSuccessMessage('✅ 記錄保存成功！')
        // 重新初始化當前用戶數據
        store.initializeCurrentUser()
      } else {
        console.error('記錄保存失敗')
      }

      return
    }

    // 單個記錄的處理（保持向後兼容）
    if (!store.profitData || !store.profitData.data) {
      console.error('❌ profitData 或 data 不存在')
      return
    }

    // 找到當前用戶
    const currentUserId = Object.keys(store.profitData.data).find(
      (key) => store.profitData?.data[key] === store.currentUser,
    )

    if (!currentUserId) return

    // 檢查是否已存在該日期的記錄
    const existingRecords = store.profitData.data[currentUserId].date.filter(
      (item) => item.date === record.date,
    )

    if (existingRecords.length > 0) {
      // 更新現有記錄：移除所有舊記錄，添加新記錄
      store.profitData.data[currentUserId].date = store.profitData.data[currentUserId].date.filter(
        (item) => item.date !== record.date,
      )
    }

    // 添加新記錄
    store.profitData.data[currentUserId].date.push(record)

    // 調用 API 保存數據
    const success = await store.updateData(store.profitData)

    if (success) {
      console.log('記錄保存成功:', record)
      showSuccessMessage('✅ 記錄保存成功！')
      // 重新初始化當前用戶數據
      store.initializeCurrentUser()
    } else {
      console.error('記錄保存失敗')
    }
  } catch (error) {
    console.error('保存記錄時出錯:', error)
  } finally {
    // 關閉模態框
    showAddRecordModal.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 使用 Header 组件 -->
    <Header />

    <!-- 统计数据 -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-value projects">{{ totalProjects }}</div>
          <div class="stat-label">项目总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value income">${{ totalIncome.toFixed(1) }}</div>
          <div class="stat-label">累计收入</div>
        </div>
        <div class="stat-card">
          <div class="stat-value fees">${{ totalFees.toFixed(1) }}</div>
          <div class="stat-label">手续费</div>
        </div>
        <div class="stat-card">
          <div class="stat-value profit">${{ totalProfit.toFixed(1) }}</div>
          <div class="stat-label">利润</div>
        </div>
      </div>
    </section>

    <!-- 日历导航 -->
    <section class="calendar-nav">
      <div class="calendar-header">
        <button class="nav-arrow" @click="previousMonth">‹</button>
        <div class="center-content">
          <div class="month-year">{{ monthYear }}</div>
          <div class="monthly-summary">{{ dailySummary }}</div>
        </div>
        <button class="nav-arrow" :class="{ disabled: !hasNextMonthData }" @click="nextMonth">
          ›
        </button>
      </div>
    </section>

    <!-- 日历网格 -->
    <section class="calendar-section">
      <div class="calendar-weekdays">
        <div class="weekday">日</div>
        <div class="weekday">一</div>
        <div class="weekday">二</div>
        <div class="weekday">三</div>
        <div class="weekday">四</div>
        <div class="weekday">五</div>
        <div class="weekday">六</div>
      </div>
      <div class="calendar-grid">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="calendar-day"
          :class="{
            'other-month': day.isOtherMonth,
            today: day.isToday,
            'has-data': day.hasData,
            'has-fee': day.hasFee,
          }"
          @click="selectDate(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div v-if="day.hasData || day.hasFee" class="day-data">
            <!-- 顯示所有收益記錄 -->
            <template v-for="record in day.records" :key="record.date + record.coin">
              <div v-if="record.coin && (record.amount || 0) > 0" class="day-income">
                {{ record.coin }}: ${{ Math.round(record.amount || 0) }}
              </div>
            </template>
            <!-- 顯示手續費 -->
            <div v-if="day.hasFee" class="day-fee">fee: ${{ day.fee.toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 導入導出模態框 -->
    <ImportExportModal :show="showImportExportModal" @close="showImportExportModal = false" />

    <!-- 新建/修改記錄模態框 -->
    <AddRecordModal
      :show="showAddRecordModal"
      :selected-date="selectedDateForModal"
      :existing-record="existingRecordForModal"
      @close="showAddRecordModal = false"
      @save="saveRecord"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* 统计数据区域 */
.stats-section {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
}

.stats-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.stat-card {
  background: var(--bg-primary);
  padding: 0.7rem 1rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  text-align: center;
  transition: all 0.3s ease;
  min-width: 140px;
  flex-shrink: 0;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-value.income {
  color: var(--success);
}

.stat-value.projects {
  color: var(--primary);
}

.stat-value.profit {
  color: var(--warning);
}

.stat-value.fees {
  color: var(--error);
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 500;
}

/* 日历导航 */
.calendar-nav {
  padding: 0.75rem 1.5rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.nav-arrow {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.nav-arrow:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.nav-arrow.disabled {
  opacity: 0.5;
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.nav-arrow.disabled:hover {
  background: var(--bg-secondary);
  transform: none;
  box-shadow: var(--shadow-md);
}

.month-year {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 100px;
  text-align: center;
}

.monthly-summary {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

/* 日历区域 */
.calendar-section {
  padding: 1.5rem;
  background: var(--bg-primary);
  border-radius: 8px;
  margin: 0.5rem;
  box-shadow:
    2px 0 8px rgba(0, 0, 0, 0.12),
    -2px 0 8px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.weekday {
  text-align: center;
  font-weight: 700;
  color: var(--text-primary);
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.calendar-day {
  background: var(--bg-primary);
  border: none;
  padding: 0.5rem 0.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  min-height: 70px;
}

.calendar-day:hover {
  background: var(--bg-secondary);
  transform: scale(1.02);
  z-index: 1;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

/* 手续费数据不改变背景色，只改变文字颜色 */
.calendar-day.has-fee {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.calendar-day.has-fee:hover {
  background: var(--bg-secondary);
}

.calendar-day.has-data {
  background: var(--success);
  color: white;
  border-color: var(--success);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

.calendar-day.has-data .day-number {
  color: white;
}

.calendar-day.has-data .day-data {
  color: white;
}

.calendar-day.has-data:hover {
  background: var(--success);
  opacity: 0.9;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
}

/* 手續費數據樣式 - 去除紅框，只保留文字顏色 */
.calendar-day.has-fee:not(.has-data) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.calendar-day.has-fee:not(.has-data) .day-fee {
  color: var(--error);
  font-weight: 600;
}

.calendar-day.has-fee:not(.has-data):hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.calendar-day.has-data.has-fee {
  background: 'var(--success)';
  color: white;
  border-color: var(--success);
}

.calendar-day.has-data.has-fee:hover {
  background: var(--success);
  opacity: 0.9;
}

.calendar-day.has-data.has-fee .day-fee {
  color: var(--error) !important;
}

.calendar-day.today {
  border-top: 4px solid var(--primary);
  position: relative;
  box-shadow:
    0 0px 7px rgba(59, 130, 246, 0.5),
    0 1px 1px rgba(0, 0, 0, 0.1);
}

.calendar-day.today .day-number {
  font-weight: 800;
}

.calendar-day.other-month {
  opacity: 0.5;
  background: var(--bg-primary);
}

.day-number {
  font-weight: 700;
  font-size: 0.875rem;
  align-self: flex-start;
  color: var(--text-primary);
}

.day-data-container {
  position: absolute;
  bottom: 0.25rem;
  right: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.day-data {
  font-size: 0.6rem;
  text-align: right;
  line-height: 1;
}

.claimed-data {
  color: white;
  font-weight: 500;
}

.fee-data {
  color: var(--error) !important;
  font-weight: 500;
}

.claimable-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.6rem;
  color: var(--warning);
  font-weight: 600;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  padding: 1px 2px;
  border-radius: 2px;
}

.score-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.6rem;
  color: var(--primary);
  font-weight: 600;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  padding: 1px 2px;
  border-radius: 2px;
}

.custom-tooltip {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.custom-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
}

.calendar-day:hover .custom-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  .stat-card {
    min-width: auto;
    width: calc(50% - 0.375rem);
    max-width: 160px;
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .calendar-nav {
    padding: 1rem;
  }

  .calendar-section {
    padding: 1rem;
  }

  .calendar-day {
    padding: 0.25rem;
    min-height: 50px;
  }

  .day-number {
    font-size: 0.75rem;
  }

  .day-data-container {
    bottom: 0.125rem;
    right: 0.125rem;
    gap: 0.0625rem;
  }

  .day-data {
    font-size: 0.625rem;
  }
}

/* PC端优化 */
@media (min-width: 769px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .calendar-nav,
  .calendar-section {
    max-width: 900px;
    margin: 0 auto;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .calendar-day {
    min-height: 80px;
    aspect-ratio: auto;
  }

  .day-number {
    font-size: 1rem;
  }

  .day-data-container {
    bottom: 0.5rem;
    right: 0.5rem;
    gap: 0.25rem;
  }

  .day-data {
    font-size: 0.8rem;
  }

  .nav-arrow {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .nav-tabs {
    flex-direction: column;
    gap: 0.25rem;
  }

  .tab-btn {
    width: 100%;
  }

  .calendar-weekdays {
    gap: 1px;
  }

  .calendar-grid {
    gap: 1px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  animation: fadeIn 0.6s ease-out;
}

.stat-card:nth-child(2) {
  animation-delay: 0.1s;
}

.stat-card:nth-child(3) {
  animation-delay: 0.2s;
}
</style>
