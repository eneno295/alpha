<template>
  <section class="card">
    <div class="panel-head">
      <div>
        <h1>结果面板</h1>
        <p class="sub">
          当前结果：单网格数量、总持仓数量、网格均价、总名义价值、估算杠杆、每日/每月收益。
        </p>
      </div>
      <button class="toggle-btn" type="button" @click="showFormula = !showFormula">
        {{ showFormula ? '隐藏公式' : '显示公式' }}
      </button>
    </div>

    <div class="stat">
      <div class="item">
        <div class="k">单网格数量（币）</div>
        <div class="v">{{ result.qtyPerGridOut }}</div>
        <div v-if="showFormula" class="formula">公式：单网格数量 = 总持仓数量 / 网格数量</div>
      </div>
      <div class="item">
        <div class="k">总持仓数量（币）</div>
        <div class="v">{{ result.totalQtyOut }}</div>
        <div v-if="showFormula" class="formula">公式：总持仓数量 = 总名义价值 / 网格均价</div>
      </div>
      <div class="item">
        <div class="k">网格均价（USDT）</div>
        <div class="v">{{ result.avgGridPriceOut }}</div>
        <div v-if="showFormula" class="formula">公式：等差=(下限+上限)/2；等比=几何级数均值</div>
      </div>
      <div class="item">
        <div class="k">总名义价值（USDT）</div>
        <div class="v">{{ result.notionalOut }}</div>
        <div v-if="showFormula" class="formula">
          公式：总名义价值 = 投资金额 x 倍数 x (1-预留率)
        </div>
      </div>
      <div class="item">
        <div class="k">估算杠杆倍数</div>
        <div class="v warn">{{ result.leverageOut }}</div>
        <div v-if="showFormula" class="formula">公式：估算杠杆 = 总名义价值 / 投资金额</div>
      </div>
      <div class="item">
        <div class="k">预估爆仓价（USDT）</div>
        <div class="v bad">{{ result.liqPriceOut }}</div>
        <div v-if="showFormula" class="formula">
          公式：均价 - (投资额 - 名义价值x(MMR+Taker))/总持仓
        </div>
      </div>
      <div class="item">
        <div class="k">每日收益（USDT）</div>
        <div class="v ok">{{ result.dailyProfitOut }}</div>
        <div v-if="showFormula" class="formula">公式：每日收益 = 单格净收益 x 每日成交格数</div>
      </div>
      <div class="item">
        <div class="k">每月收益（USDT）</div>
        <div class="v ok">{{ result.monthlyProfitOut }}</div>
        <div v-if="showFormula" class="formula">公式：每月收益 = 每日收益 x 30</div>
      </div>
      <div class="item">
        <div class="k">匹配MMR档位</div>
        <div class="v">{{ result.mmrTierOut }}</div>
      </div>
      <div class="item full">
        <details class="detail-block">
          <summary>每格需添加保证金明细（按预估价位每格差价）</summary>
          <div v-if="showFormula" class="formula">
            公式：每格需加保证金 = 相邻两档累计保证金差值
          </div>

          <div class="mode-line">
            <label>预估持仓模式：</label>
            <button
              class="mode-btn"
              :class="{ active: marginPositionMode === 'realtime' }"
              type="button"
              @click="$emit('update:marginPositionMode', 'realtime')"
            >
              实时
            </button>
            <button
              class="mode-btn"
              :class="{ active: marginPositionMode === 'total' }"
              type="button"
              @click="$emit('update:marginPositionMode', 'total')"
            >
              总持仓
            </button>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>格数</th>
                  <th>对应价位</th>
                  <th>当前持仓数</th>
                  <th>每格需加保证金</th>
                  <th>累计需加保证金</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="result.marginRows.length === 0">
                  <td colspan="5">-</td>
                </tr>
                <tr v-for="row in result.marginRows" :key="row.step">
                  <td>{{ row.step }}</td>
                  <td>{{ row.price }}</td>
                  <td>{{ row.positionQty }}</td>
                  <td>{{ row.perGridMargin }}</td>
                  <td>{{ row.cumulative }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { MarginPositionMode } from '../riskConfig'

const showFormula = ref(false)

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
  marginRows: Array<{
    step: number
    price: string
    positionQty: string
    perGridMargin: string
    cumulative: string
  }>
}

defineProps({
  result: { type: Object as PropType<ResultData>, required: true },
  marginPositionMode: { type: String as PropType<MarginPositionMode>, required: true },
})

defineEmits<{
  (e: 'update:marginPositionMode', value: MarginPositionMode): void
}>()
</script>

<style lang="scss" scoped>
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

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.toggle-btn {
  border: 1px solid var(--line);
  color: var(--muted);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
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

.formula {
  margin-top: 6px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.4;
}

.ok {
  color: var(--ok);
}
.warn {
  color: var(--warn);
}
.bad {
  color: var(--bad);
}

.mode-btn {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--line);
  color: var(--text);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border-radius: 10px;
  cursor: pointer;
}

.mode-btn.active {
  border-color: var(--accent);
  color: #dce9ff;
  background: linear-gradient(180deg, rgba(110, 168, 255, 0.28), rgba(110, 168, 255, 0.12));
  box-shadow: 0 0 0 1px rgba(110, 168, 255, 0.25) inset;
}

.mode-line {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  margin-top: 8px;
  margin-bottom: 8px;
}

.table-wrap {
  overflow: auto;
  max-height: 320px;
  border: 1px solid var(--line);
  border-radius: 10px;
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

.full {
  grid-column: 1 / -1;
}

.detail-block > summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  user-select: none;
}
</style>
