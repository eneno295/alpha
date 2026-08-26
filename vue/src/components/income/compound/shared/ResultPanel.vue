<template>
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
                <tr v-if="!result.yearRows.length">
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
</template>

<script setup lang="ts">
import type { ResultView } from '../types'

defineProps<{
  result: ResultView
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
