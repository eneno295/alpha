<template>
  <div class="compound-wrap">
    <section class="card">
      <h1>复利计算器</h1>
      <p class="sub">按初始本金 + 定期定投，估算复利增长；支持不同复利频率。</p>

      <div class="grid">
        <div class="field">
          <label>初始本金（USDT）</label>
          <input v-model.number="form.principal" type="number" step="0.01" />
        </div>
        <div class="field">
          <label>年化收益率（%）</label>
          <input v-model.number="form.annualRate" type="number" step="0.01" />
        </div>
        <div class="field">
          <label>投资年数</label>
          <input v-model.number="form.years" type="number" step="1" />
        </div>
        <div class="field">
          <label>复利频率</label>
          <select v-model="form.frequency">
            <option v-for="opt in frequencyOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="field full">
          <label>每期定投（每{{ currentFrequencyLabel }}，USDT，可为 0）</label>
          <input v-model.number="form.contribution" type="number" step="0.01" />
        </div>
      </div>

      <p class="tip">{{ result.hint }}</p>
    </section>

    <section class="card">
      <div class="panel-head">
        <div>
          <h1>结果面板</h1>
          <p class="sub">期末总额、累计投入、累计收益与总收益率，并按年展开明细。</p>
        </div>
      </div>

      <div class="stat">
        <div class="item">
          <div class="k">期末总额（USDT）</div>
          <div class="v ok">{{ result.finalBalanceOut }}</div>
        </div>
        <div class="item">
          <div class="k">累计投入（USDT）</div>
          <div class="v">{{ result.totalInvestedOut }}</div>
        </div>
        <div class="item">
          <div class="k">累计收益（USDT）</div>
          <div class="v ok">{{ result.totalProfitOut }}</div>
        </div>
        <div class="item">
          <div class="k">总收益率</div>
          <div class="v warn">{{ result.totalRoiOut }}</div>
        </div>
        <div class="item full">
          <details class="detail-block" open>
            <summary>按年增长明细</summary>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>年份</th>
                    <th>当年投入</th>
                    <th>当年收益</th>
                    <th>年末总额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="result.yearRows.length === 0">
                    <td colspan="4">-</td>
                  </tr>
                  <tr v-for="row in result.yearRows" :key="row.year">
                    <td>第 {{ row.year }} 年</td>
                    <td>{{ row.invested }}</td>
                    <td>{{ row.profit }}</td>
                    <td>{{ row.balance }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

type Frequency = 'year' | 'quarter' | 'month' | 'day'

type YearRow = {
  year: number
  invested: string
  profit: string
  balance: string
}

type CompoundResult = {
  finalBalanceOut: string
  totalInvestedOut: string
  totalProfitOut: string
  totalRoiOut: string
  yearRows: YearRow[]
  hint: string
}

const frequencyOptions: { value: Frequency; label: string; periods: number }[] = [
  { value: 'year', label: '年', periods: 1 },
  { value: 'quarter', label: '季', periods: 4 },
  { value: 'month', label: '月', periods: 12 },
  { value: 'day', label: '日', periods: 365 },
]

const form = reactive({
  principal: 20000,
  annualRate: 15,
  years: 5,
  contribution: 0,
  frequency: 'month' as Frequency,
})

const currentFrequencyLabel = computed(
  () => frequencyOptions.find((opt) => opt.value === form.frequency)?.label ?? '期',
)

function num(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return '-'
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d })
}

const result = computed<CompoundResult>(() => {
  const principal = Math.max(0, num(form.principal))
  const annualRate = num(form.annualRate)
  const years = Math.floor(num(form.years))
  const contribution = num(form.contribution)
  const periodsPerYear = frequencyOptions.find((opt) => opt.value === form.frequency)?.periods ?? 12

  if (years <= 0 || (principal <= 0 && contribution <= 0)) {
    return {
      finalBalanceOut: '-',
      totalInvestedOut: '-',
      totalProfitOut: '-',
      totalRoiOut: '-',
      yearRows: [],
      hint: '提示：投资年数需大于 0，且初始本金或每期定投至少一项大于 0。',
    }
  }

  const periodicRate = annualRate / 100 / periodsPerYear
  const yearRows: YearRow[] = []

  let balance = principal
  for (let y = 1; y <= years; y += 1) {
    const startBalance = balance
    for (let p = 0; p < periodsPerYear; p += 1) {
      balance = balance * (1 + periodicRate) + contribution
    }
    const investedThisYear = contribution * periodsPerYear
    const profitThisYear = balance - startBalance - investedThisYear
    yearRows.push({
      year: y,
      invested: fmt(investedThisYear),
      profit: fmt(profitThisYear),
      balance: fmt(balance),
    })
  }

  const totalInvested = principal + contribution * periodsPerYear * years
  const totalProfit = balance - totalInvested
  const totalRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  const hint =
    `复利计算：本金=${fmt(principal)}，年化=${fmt(annualRate)}%，按${currentFrequencyLabel.value}复利` +
    `（每期利率=${fmt(periodicRate * 100, 4)}%），每期定投=${fmt(contribution)}，共 ${years} 年。`

  return {
    finalBalanceOut: fmt(balance),
    totalInvestedOut: fmt(totalInvested),
    totalProfitOut: fmt(totalProfit),
    totalRoiOut: `${fmt(totalRoi)}%`,
    yearRows,
    hint,
  }
})
</script>

<style lang="scss" scoped>
.compound-wrap {
  max-width: 1080px;
  margin: 28px auto 0;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  padding: 0 16px;
}

@media (max-width: 920px) {
  .compound-wrap {
    grid-template-columns: 1fr;
  }
}

.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent), var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

h1 {
  margin: 0 0 6px;
  font-size: 22px;
}

.sub {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
}

label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

input,
select {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 11px;
  font-size: 14px;
  outline: none;
}

.tip {
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.stat {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.item {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 12px;
  min-height: 82px;
}

.k {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 8px;
}

.v {
  font-weight: 700;
  font-size: 20px;
  line-height: 1.2;
  word-break: break-word;
}

.ok {
  color: var(--ok);
}
.warn {
  color: var(--warn);
}

.full {
  grid-column: 1 / -1;
}

.detail-block > summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  user-select: none;
}

.table-wrap {
  overflow: auto;
  max-height: 320px;
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-top: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  text-align: right;
  white-space: nowrap;
}

th:first-child,
td:first-child {
  text-align: left;
}
</style>
