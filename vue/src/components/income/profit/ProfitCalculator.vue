<template>
  <div class="profit-wrap">
    <section class="card">
      <h1>收益计算器</h1>
      <p class="sub">可添加多笔买入：按各笔现价和购买总额汇总持仓，再用统一卖出价格估算收益。</p>

      <div class="field sell-field">
        <label>卖出价格（USDT）</label>
        <input v-model.number="sellPrice" type="number" step="0.01" min="0" />
      </div>

      <div v-for="(lot, index) in lots" :key="lot.id" class="lot">
        <span class="lot-index">第 {{ index + 1 }} 笔</span>
        <div class="field">
          <label>现价（USDT）</label>
          <input v-model.number="lot.currentPrice" type="number" step="0.01" min="0" />
        </div>
        <div class="field">
          <label>购买总额（USDT）</label>
          <input v-model.number="lot.costAmount" type="number" step="0.01" min="0" />
        </div>
        <button
          v-if="lots.length > 1"
          class="link-btn"
          type="button"
          @click="removeLot(index)"
        >
          删除
        </button>
      </div>

      <button class="add-btn" type="button" @click="addLot">添加一笔</button>
      <p class="tip">{{ result.hint }}</p>
    </section>

    <section class="card">
      <div class="panel-head">
        <div>
          <h1>
            结果面板
            <button class="unit-btn" type="button" @click="toggleFiat">{{ unit }}</button>
          </h1>
          <p class="sub">汇总持仓数量、购买总额、持仓均价、卖出总额、收益和收益率。</p>
        </div>
      </div>

      <div class="stat">
        <div class="item">
          <div class="k">持仓数量</div>
          <div class="v">{{ result.qtyOut }}</div>
        </div>
        <div class="item">
          <div class="k">购买总额（{{ unit }}）</div>
          <div class="v">{{ fiat(result.costTotalOut) }}</div>
        </div>
        <div class="item">
          <div class="k">持仓均价（{{ unit }}）</div>
          <div class="v">{{ fiat(result.avgPriceOut) }}</div>
        </div>
        <div class="item">
          <div class="k">卖出总额（{{ unit }}）</div>
          <div class="v">{{ fiat(result.sellTotalOut) }}</div>
        </div>
        <div class="item">
          <div class="k">收益（{{ unit }}）</div>
          <div class="v" :class="pnlClass">{{ fiat(result.profitOut) }}</div>
        </div>
        <div class="item">
          <div class="k">收益率</div>
          <div class="v" :class="pnlClass">{{ result.roiOut }}</div>
        </div>
      </div>

      <div v-if="result.lots.length > 1" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>笔</th>
              <th>现价</th>
              <th>购买总额</th>
              <th>数量</th>
              <th>收益</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in result.lots" :key="row.index">
              <td>{{ row.index }}</td>
              <td>{{ fiat(row.avgPriceOut) }}</td>
              <td>{{ fiat(row.costOut) }}</td>
              <td>{{ row.qtyOut }}</td>
              <td :class="row.profitPositive ? 'ok' : 'bad'">{{ fiat(row.profitOut) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useFiatUnit } from '@/composables/useFiatUnit'
import { calcProfit, type ProfitLot } from './calc'

type LotRow = ProfitLot & { id: number }

let nextId = 1
const sellPrice = ref(72)
const lots = reactive<LotRow[]>([makeLot(70, 2000)])

const result = computed(() => calcProfit(lots, sellPrice.value))
const { unit, toggleFiat, fiat } = useFiatUnit()
const pnlClass = computed(() => {
  if (result.value.profitPositive === null) return ''
  return result.value.profitPositive ? 'ok' : 'bad'
})

function makeLot(currentPrice = 0, costAmount = 0): LotRow {
  return { id: nextId++, currentPrice, costAmount }
}

function addLot() {
  lots.push(makeLot())
}

function removeLot(index: number) {
  if (lots.length <= 1) return
  lots.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.profit-wrap {
  max-width: 1080px;
  margin: 28px auto 0;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  padding: 0 16px 32px;
}

@media (max-width: 920px) {
  .profit-wrap {
    grid-template-columns: 1fr;
  }
}

.card {
  container-type: inline-size;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 13px;
}

.sell-field {
  margin-bottom: 12px;
}

.lot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: 8px;
}

.lot:has(.link-btn) {
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr) auto;
}

.lot-index {
  color: var(--text);
  font-size: 12px;
  white-space: nowrap;
  line-height: 1;
}

.lot .field {
  min-width: 0;
}

@container (max-width: 480px) {
  .lot,
  .lot:has(.link-btn) {
    grid-template-columns: 1fr 1fr;
  }

  .lot-index {
    grid-column: 1;
    grid-row: 1;
    padding-bottom: 0;
    align-self: center;
  }

  .link-btn {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    align-self: center;
  }

  .lot .field {
    grid-row: 2;
  }
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

input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 11px;
  font-size: 14px;
  outline: none;
}

.add-btn,
.link-btn {
  border: 1px solid var(--line);
  color: var(--text);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
}

.link-btn {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text);
  align-self: center;
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

.unit-btn {
  border: 1px solid var(--line);
  color: var(--accent);
  background: rgba(110, 168, 255, 0.12);
  padding: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
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

.bad {
  color: var(--bad);
}

.table-wrap {
  overflow: auto;
  margin-top: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  padding: 9px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  text-align: right;
  white-space: nowrap;
  color: var(--text);
}

th {
  background: rgba(110, 168, 255, 0.16);
  color: #dce9ff;
  font-weight: 600;
}

tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.04);
}

tbody tr:last-child td {
  border-bottom: none;
}

th:first-child,
td:first-child {
  text-align: left;
}
</style>
