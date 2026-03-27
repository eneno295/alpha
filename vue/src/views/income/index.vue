<template>
  <div class="income-page">
    <Header :show-log-icon="false" />
    <div class="wrap">
      <IncomeInputPanel
        :form="form"
        :selected-platform-key="selectedPlatformKey"
        :selected-symbol-key="selectedSymbolKey"
        :platform-keys="platformKeys"
        :symbol-keys="symbolKeys"
        :risk-config="riskConfig"
        :reserve-rate-presets="reserveRatePresets"
        :simulation-presets="simulationPresets"
        :hint="result.hint"
        @update:selected-platform-key="selectedPlatformKey = $event"
        @update:selected-symbol-key="selectedSymbolKey = $event"
        @apply-simulation="applySimulation"
      />

      <IncomeResultPanel
        :result="result"
        :margin-position-mode="marginPositionMode"
        @update:margin-position-mode="marginPositionMode = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Header from '@/components/binance/Header.vue'
import { useAppInitialization } from '@/composables/useAppInitialization'
import IncomeInputPanel from './components/IncomeInputPanel.vue'
import IncomeResultPanel from './components/IncomeResultPanel.vue'
import {
  reserveRatePresets,
  riskConfig,
  simulationPresets,
  tiersToText,
  type GridMode,
  type MarginPositionMode,
  type SimulationPresetKey,
  type Tier,
} from './riskConfig'

const { initializeApp } = useAppInitialization()

type MarginRow = {
  step: number
  price: string
  positionQty: string
  perGridMargin: string
  cumulative: string
}

type ResultData = {
  qtyPerGridOut: string
  totalQtyOut: string
  avgGridPriceOut: string
  notionalOut: string
  leverageOut: string
  liqPriceOut: string
  mmrTierOut: string
  dailyProfitOut: string
  monthlyProfitOut: string
  marginRows: MarginRow[]
  hint: string
}

// 表单输入默认值（与 HTML 版本保持一致）
const form = reactive({
  investAmount: 2000,
  gridMode: 'arithmetic' as GridMode,
  multiplier: 10,
  reserveRate: 5.76,
  grids: 70,
  dailyFilledGrids: 8,
  rangeLow: 1026,
  rangeHigh: 2426,
  estimatePrice: 1000,
  estimateGridDiff: 100,
  makerFeeRate: 0.02,
  takerFeeRate: 0.05,
  mmrTiers:
    '5000:0.40,10000:0.50,25000:0.75,50000:1.25,75000:1.75,100000:2.25,125000:2.75,150000:3.25,175000:3.75,INF:4.25',
})

// 保证金估算模式：实时持仓 / 总持仓
const marginPositionMode = ref<MarginPositionMode>('realtime')

// 当前平台、币种选择
const selectedPlatformKey = ref('okx')
const selectedSymbolKey = ref('ETH')

// 平台与币种选项（由风险配置推导）
const platformKeys = computed(() => Object.keys(riskConfig))
const symbolKeys = computed(() => {
  const symbols = riskConfig[selectedPlatformKey.value]?.symbols || {}
  return Object.keys(symbols)
})

// 切换平台时，自动切到该平台默认币种（优先 ETH）
watch(selectedPlatformKey, (value) => {
  const symbols = Object.keys(riskConfig[value].symbols)
  selectedSymbolKey.value = symbols.includes('ETH') ? 'ETH' : symbols[0]
})

// 平台/币种变化时，同步费率和 MMR 分档文案
watch(
  [selectedPlatformKey, selectedSymbolKey],
  ([platform, symbol]) => {
    const cfg = riskConfig[platform]?.symbols?.[symbol]
    if (!cfg) return
    form.makerFeeRate = cfg.makerFeeRate
    form.takerFeeRate = cfg.takerFeeRate
    form.mmrTiers = tiersToText(cfg.tiers)
  },
  { immediate: true },
)

// 应用“模拟数据”预设（参数在 riskConfig.ts 维护）
function applySimulation(key: SimulationPresetKey) {
  const preset = simulationPresets.find((item) => item.key === key)
  if (!preset) return
  if (preset.platformKey) selectedPlatformKey.value = preset.platformKey
  if (preset.symbolKey) selectedSymbolKey.value = preset.symbolKey
  Object.assign(form, preset.values)
}

// 核心计算：把输入参数转换为页面展示结果
const result = computed<ResultData>(() => {
  const investAmount = num(form.investAmount)
  const multiplier = num(form.multiplier)
  const reserveRate = Math.min(99.99, Math.max(0, num(form.reserveRate)))
  const makerFeeRate = Math.max(0, num(form.makerFeeRate)) / 100
  const takerFeeRate = Math.max(0, num(form.takerFeeRate)) / 100
  const tierAsset = selectedSymbolKey.value || 'ETH'
  const mmrTiers = parseMmrTiers(form.mmrTiers)
  const rangeLow = num(form.rangeLow)
  const rangeHigh = num(form.rangeHigh)
  const grids = num(form.grids)
  const dailyFilledGrids = Math.max(0, num(form.dailyFilledGrids))
  const estimatePrice = num(form.estimatePrice)
  const estimateGridDiff = num(form.estimateGridDiff)
  const gridMode = form.gridMode
  const positionMode = marginPositionMode.value

  // 输入合法性校验
  if (
    investAmount <= 0 ||
    multiplier <= 0 ||
    grids <= 0 ||
    rangeLow <= 0 ||
    rangeHigh <= 0 ||
    estimatePrice <= 0 ||
    estimateGridDiff <= 0 ||
    !mmrTiers.length
  ) {
    return emptyResult('提示：输入需有效，且分档格式正确（示例：5000:0.40,10000:0.50,INF:4.25）。')
  }

  if (rangeHigh <= rangeLow) {
    return emptyResult('提示：策略区间上限必须大于下限。')
  }

  // 1) 资金侧计算：总投入、可用资金、均价
  const totalInvest = investAmount * multiplier
  const usableInvest = totalInvest * (1 - reserveRate / 100)
  const gridStep = (rangeHigh - rangeLow) / grids

  let avgGridPrice = 0
  if (gridMode === 'geometric') {
    const r = Math.pow(rangeHigh / rangeLow, 1 / grids)
    avgGridPrice =
      Math.abs(r - 1) < 1e-10
        ? (rangeLow + rangeHigh) / 2
        : (rangeLow * (Math.pow(r, grids) - 1)) / (grids * (r - 1))
  } else {
    avgGridPrice = (rangeLow + rangeHigh) / 2
  }

  // 2) 仓位与收益计算
  const totalQty = usableInvest / avgGridPrice
  const qtyPerGrid = totalQty / grids
  const leverageEst = usableInvest / investAmount
  const mmrTier = resolveMmrTier(totalQty, mmrTiers)
  const mmrRate = mmrTier ? mmrTier.rate : 0
  const liqBuffer = investAmount - usableInvest * (mmrRate + takerFeeRate)
  const liqPrice = Math.max(0, avgGridPrice - liqBuffer / totalQty)
  const perGridProfitGross =
    gridMode === 'geometric'
      ? qtyPerGrid * avgGridPrice * (Math.pow(rangeHigh / rangeLow, 1 / grids) - 1)
      : qtyPerGrid * gridStep
  const perGridFee = qtyPerGrid * avgGridPrice * (makerFeeRate + takerFeeRate)
  const perGridProfit = Math.max(0, perGridProfitGross - perGridFee)
  const dailyProfit = perGridProfit * dailyFilledGrids
  const monthlyProfit = dailyProfit * 30
  const dailyRoi = investAmount > 0 ? (dailyProfit / investAmount) * 100 : 0
  const monthlyRoi = investAmount > 0 ? (monthlyProfit / investAmount) * 100 : 0

  // 3) 逐格保证金明细计算（从爆仓价往预估价推进）
  const distance = Math.abs(liqPrice - estimatePrice)
  const steps = estimateGridDiff > 0 ? Math.ceil(distance / estimateGridDiff) : 0
  const marginRows: MarginRow[] = []

  if (Number.isFinite(steps) && steps > 0) {
    const direction = estimatePrice >= liqPrice ? 1 : -1
    let prevCumulative = 0
    for (let i = 1; i <= steps; i += 1) {
      const targetPrice = liqPrice + direction * estimateGridDiff * i
      const price =
        direction > 0 ? Math.min(targetPrice, estimatePrice) : Math.max(targetPrice, estimatePrice)
      const positionQty =
        positionMode === 'total'
          ? totalQty
          : calcRealtimePositionQty(
              price,
              rangeLow,
              rangeHigh,
              grids,
              qtyPerGrid,
              totalQty,
              gridMode,
            )
      const cumulative = calcCumulativeMarginToPrice(
        liqPrice,
        price,
        rangeLow,
        rangeHigh,
        grids,
        qtyPerGrid,
        totalQty,
        gridMode,
        positionMode,
      )
      const perGridMargin = cumulative - prevCumulative
      marginRows.push({
        step: i,
        price: fmt(price, 2),
        positionQty: `${fmt(positionQty, 4)} 个`,
        perGridMargin: fmt(perGridMargin, 2),
        cumulative: fmt(cumulative, 2),
      })
      prevCumulative = cumulative
    }
  }

  let hint = ''
  if (gridMode === 'geometric') {
    const ratio = Math.pow(rangeHigh / rangeLow, 1 / grids)
    hint =
      `等比计算：总投入=${fmt(investAmount, 2)}×${fmt(multiplier, 2)}，预留率=${fmt(reserveRate, 2)}%，可用资金=${fmt(usableInvest, 2)}` +
      `，Maker/Taker=${fmt(makerFeeRate * 100, 2)}%/${fmt(takerFeeRate * 100, 2)}%` +
      `，匹配MMR=${fmt(mmrRate * 100, 2)}%（按${tierAsset}持仓分档）` +
      `，平均挂单价≈${fmt(avgGridPrice, 2)}，单网格数量=(${fmt(usableInvest, 2)}/${fmt(avgGridPrice, 2)})/${fmt(grids, 0)}=${fmt(qtyPerGrid, 6)}；每格比率≈×${fmt(ratio, 6)}`
  } else {
    hint =
      `等差计算：总投入=${fmt(investAmount, 2)}×${fmt(multiplier, 2)}，预留率=${fmt(reserveRate, 2)}%，可用资金=${fmt(usableInvest, 2)}` +
      `，Maker/Taker=${fmt(makerFeeRate * 100, 2)}%/${fmt(takerFeeRate * 100, 2)}%` +
      `，匹配MMR=${fmt(mmrRate * 100, 2)}%（按${tierAsset}持仓分档）` +
      `，中位价=(${fmt(rangeLow, 2)}+${fmt(rangeHigh, 2)})/2=${fmt(avgGridPrice, 2)}，单网格数量=(${fmt(usableInvest, 2)}/${fmt(avgGridPrice, 2)})/${fmt(grids, 0)}=${fmt(qtyPerGrid, 6)}；每格价差≈${fmt(gridStep, 2)} USDT`
  }

  return {
    qtyPerGridOut: fmt(qtyPerGrid, 6),
    totalQtyOut: fmt(totalQty, 4),
    avgGridPriceOut: fmt(avgGridPrice, 2),
    notionalOut: fmt(usableInvest, 2),
    leverageOut: `${fmt(leverageEst, 2)}x`,
    liqPriceOut: fmt(liqPrice, 2),
    mmrTierOut: mmrTier
      ? `${fmt(mmrRate * 100, 2)}%（≤${Number.isFinite(mmrTier.cap) ? fmt(mmrTier.cap, 0) : 'INF'} ${tierAsset}）`
      : '-',
    dailyProfitOut: `${fmt(dailyProfit, 2)}（${fmt(dailyRoi, 2)}%）`,
    monthlyProfitOut: `${fmt(monthlyProfit, 2)}（${fmt(monthlyRoi, 2)}%）`,
    marginRows,
    hint,
  }
})

// 工具函数：安全数值转换
function num(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

// 工具函数：统一格式化输出
function fmt(v: number, d = 4): string {
  if (!Number.isFinite(v)) return '-'
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d })
}

// 工具函数：解析 MMR 分档文本（如 5000:0.40,INF:4.25）
function parseMmrTiers(text: string): Tier[] {
  const entries = String(text || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  const tiers: Tier[] = []
  entries.forEach((entry) => {
    const parts = entry.split(':').map((x) => x.trim())
    if (parts.length !== 2) return
    const capRaw = parts[0].toUpperCase()
    const cap = capRaw === 'INF' ? Infinity : num(capRaw)
    const rate = num(parts[1]) / 100
    if ((!Number.isFinite(cap) && cap !== Infinity) || rate < 0) return
    if (cap <= 0 && cap !== Infinity) return
    tiers.push({ cap, rate })
  })
  return tiers.sort((a, b) => a.cap - b.cap)
}

// 工具函数：按持仓数量命中对应 MMR 档位
function resolveMmrTier(positionQty: number, tiers: Tier[]): Tier | null {
  if (!tiers.length) return null
  for (const tier of tiers) {
    if (positionQty <= tier.cap) return tier
  }
  return tiers[tiers.length - 1]
}

// 工具函数：按当前价位估算“实时持仓数量”
function calcRealtimePositionQty(
  price: number,
  rangeLow: number,
  rangeHigh: number,
  grids: number,
  qtyPerGrid: number,
  totalQty: number,
  gridMode: GridMode,
): number {
  if (price >= rangeHigh) return 0
  if (price <= rangeLow) return totalQty
  let filledGrids = 0
  if (gridMode === 'geometric') {
    const r = Math.pow(rangeHigh / rangeLow, 1 / grids)
    filledGrids = Math.floor(Math.log(rangeHigh / price) / Math.log(r))
  } else {
    const step = (rangeHigh - rangeLow) / grids
    filledGrids = Math.floor((rangeHigh - price) / step)
  }
  filledGrids = Math.max(0, Math.min(grids, filledGrids))
  return Math.min(totalQty, qtyPerGrid * filledGrids)
}

// 工具函数：积分方式估算从爆仓价到目标价的累计保证金
function calcCumulativeMarginToPrice(
  liqPrice: number,
  targetPrice: number,
  rangeLow: number,
  rangeHigh: number,
  grids: number,
  qtyPerGrid: number,
  totalQty: number,
  gridMode: GridMode,
  positionMode: MarginPositionMode,
): number {
  const distance = Math.abs(targetPrice - liqPrice)
  if (!Number.isFinite(distance) || distance <= 0) return 0
  const direction = targetPrice >= liqPrice ? 1 : -1
  const integrationStep = 1
  let p = liqPrice
  let cumulative = 0

  while (Math.abs(targetPrice - p) > 1e-12) {
    const move = Math.min(integrationStep, Math.abs(targetPrice - p))
    const next = p + direction * move
    const mid = (p + next) / 2
    const qty =
      positionMode === 'total'
        ? totalQty
        : calcRealtimePositionQty(mid, rangeLow, rangeHigh, grids, qtyPerGrid, totalQty, gridMode)
    cumulative += move * qty
    p = next
  }
  return cumulative
}

// 工具函数：返回统一的空结果结构
function emptyResult(hint: string): ResultData {
  return {
    qtyPerGridOut: '-',
    totalQtyOut: '-',
    avgGridPriceOut: '-',
    notionalOut: '-',
    leverageOut: '-',
    liqPriceOut: '-',
    mmrTierOut: '-',
    dailyProfitOut: '-',
    monthlyProfitOut: '-',
    marginRows: [],
    hint,
  }
}

// income 页面刷新时主动拉一次数据（该页面本身没有复用其它页面的生命周期初始化）
onMounted(() => {
  initializeApp()
})
</script>

<style lang="scss" scoped>
:deep(.header) {
  --header-bg: var(--bg);
}
.income-page {
  --bg: #0b1020;
  --card: #131a31;
  --card-2: #1a2342;
  --text: #eef3ff;
  --muted: #9fb1d9;
  --ok: #38d39f;
  --warn: #ffca57;
  --bad: #ff6b6b;
  --line: rgba(255, 255, 255, 0.08);
  --accent: #6ea8ff;
  color: var(--text);
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 80% -20%, rgba(110, 168, 255, 0.2), transparent 60%),
    radial-gradient(1000px 500px at -10% 110%, rgba(56, 211, 159, 0.18), transparent 55%), var(--bg);
}

.wrap {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  margin-top: 28px;
  padding: 0 16px;
}

@media (max-width: 920px) {
  .wrap {
    grid-template-columns: 1fr;
  }
}
</style>
