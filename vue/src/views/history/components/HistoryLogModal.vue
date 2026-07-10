<template>
  <BaseModal
    :visible="visible"
    title="操作日志"
    size="large"
    :show-footer="false"
    content-class="history-log-modal"
    @close="emit('close')"
  >
    <div class="log-shell">
      <div v-if="loading" class="state-box">加载中…</div>
      <div v-else-if="error" class="state-box error">{{ error }}</div>
      <div v-else-if="!logs.length" class="state-box empty">
        <span class="empty-icon">📝</span>
        <p>暂无操作日志</p>
      </div>
      <div v-else class="timeline">
        <button
          v-for="log in logs"
          :key="log.id"
          type="button"
          class="log-card"
          @click="openDetail(log)"
        >
          <div class="log-card-top">
            <span class="op-badge" :class="operationTone(log.operation)">
              {{ OPERATION_LABELS[log.operation] }}
            </span>
            <span class="log-no">#{{ log.id }}</span>
          </div>
          <p class="log-desc">{{ summarize(log) }}</p>
          <div class="log-card-foot">
            <span>{{ log.created_at }}</span>
            <span class="dot">·</span>
            <span>{{ log.ip || '未知 IP' }}</span>
          </div>
        </button>
      </div>
      <p v-if="logs.length" class="list-foot">共 {{ logs.length }} 条</p>
    </div>
  </BaseModal>

  <BaseModal
    :visible="detailVisible"
    title="变更详情"
    size="large"
    :show-footer="false"
    content-class="history-log-modal"
    @close="detailVisible = false"
  >
    <div v-if="selected" class="detail-shell">
      <div class="meta-bar">
        <span class="op-badge lg" :class="operationTone(selected.operation)">
          {{ OPERATION_LABELS[selected.operation] }}
        </span>
        <span class="meta-chip">{{ selected.created_at }}</span>
        <span class="meta-chip">IP {{ selected.ip || '—' }}</span>
        <span class="meta-chip">
          {{ TARGET_TYPE_LABELS[selected.target_type] }} #{{ selected.target_id ?? '—' }}
        </span>
      </div>

      <section v-if="isPeopleLog(selected)" class="panel">
        <h3>人员列表</h3>
        <div class="chip-row">
          <span
            v-for="chip in buildPeopleChips(selected)"
            :key="chip.id"
            class="person-chip"
            :class="chip.status"
          >
            <span class="chip-mark">{{ chipMark(chip.status) }}</span>
            {{ chip.name }}
          </span>
        </div>
        <p class="legend">
          <span><i class="mark add" />新增</span>
          <span><i class="mark del" />删除</span>
          <span><i class="mark same" />未变</span>
        </p>
      </section>

      <section v-else-if="isSessionLog(selected)" class="panel">
        <h3>场次信息</h3>
        <div class="diff-cols">
          <div class="diff-box before">
            <div class="diff-label">变更前</div>
            <div v-if="sessionBefore" class="session-card">
              <div class="session-line">第 {{ sessionBefore.sessionNo }} 场</div>
              <div class="session-sub">{{ sessionBefore.time }}</div>
              <div class="session-sub">
                参与：{{ sessionBefore.participants.map((p) => p.name).join('、') || '—' }}
              </div>
              <div class="session-sub">共 {{ sessionBefore.rounds.length }} 局</div>
              <div v-if="sessionBefore.settled" class="session-sub settled">已结清</div>
            </div>
            <div v-else class="empty-slot">无（新建）</div>
          </div>
          <div class="diff-arrow">→</div>
          <div class="diff-box after">
            <div class="diff-label">变更后</div>
            <div v-if="sessionAfter" class="session-card">
              <div class="session-line">第 {{ sessionAfter.sessionNo }} 场</div>
              <div class="session-sub">{{ sessionAfter.time }}</div>
              <div class="session-sub">
                参与：{{ sessionAfter.participants.map((p) => p.name).join('、') || '—' }}
              </div>
              <div class="session-sub">共 {{ sessionAfter.rounds.length }} 局</div>
              <div v-if="sessionAfter.settled" class="session-sub settled">
                已结清{{ sessionAfter.settledAt ? ` · ${sessionAfter.settledAt}` : '' }}
              </div>
            </div>
            <div v-else class="empty-slot">无（已删除）</div>
          </div>
        </div>
      </section>

      <section v-else-if="isRoundLog(selected)" class="panel">
        <h3>
          第 {{ roundView.sessionId }} 场
          <template v-if="roundView.before || roundView.after">
            · 第 {{ (roundView.after ?? roundView.before)?.roundNo }} 局
          </template>
        </h3>
        <div v-if="roundView.before?.time || roundView.after?.time" class="round-time">
          时间：{{ roundView.after?.time || roundView.before?.time }}
        </div>
        <table class="amount-table">
          <thead>
            <tr>
              <th>玩家</th>
              <th class="col-before">变更前</th>
              <th class="col-after">变更后</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in amountRows" :key="row.name" :class="{ changed: row.changed }">
              <td>{{ row.name }}</td>
              <td class="col-before" :class="{ 'cell-changed': row.changed }">
                {{ formatAmount(row.before) }}
              </td>
              <td class="col-after" :class="{ 'cell-changed': row.changed }">
                {{ formatAmount(row.after) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else class="panel">
        <details class="raw-fold">
          <summary>原始数据</summary>
          <div class="diff-cols raw">
            <pre>{{ formatLogJson(selected.before_data) }}</pre>
            <pre>{{ formatLogJson(selected.after_data) }}</pre>
          </div>
        </details>
      </section>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import {
  OPERATION_LABELS,
  TARGET_TYPE_LABELS,
  formatLogJson,
  loadOperationLogs,
} from '../api/historyOpLog'
import {
  buildAmountRows,
  buildPeopleChips,
  formatAmount,
  getRoundSnapshot,
  operationTone,
} from '../utils/historyLogView'
import type { OperationLogEntry, Session } from '../types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const logs = ref<OperationLogEntry[]>([])
const loading = ref(false)
const error = ref('')
const detailVisible = ref(false)
const selected = ref<OperationLogEntry | null>(null)

const sessionBefore = computed(() => {
  if (!selected.value || !isSessionLog(selected.value)) return null
  const d = selected.value.before_data
  return d && typeof d === 'object' && 'sessionNo' in d ? (d as Session) : null
})

const sessionAfter = computed(() => {
  if (!selected.value || !isSessionLog(selected.value)) return null
  const d = selected.value.after_data
  return d && typeof d === 'object' && 'sessionNo' in d ? (d as Session) : null
})

const roundView = computed(() =>
  selected.value ? getRoundSnapshot(selected.value) : { before: null, after: null },
)

const amountRows = computed(() =>
  selected.value ? buildAmountRows(roundView.value.before, roundView.value.after) : [],
)

function isPeopleLog(log: OperationLogEntry) {
  return log.target_type === 'people'
}

function isSessionLog(log: OperationLogEntry) {
  return log.target_type === 'session'
}

function isRoundLog(log: OperationLogEntry) {
  return log.target_type === 'round'
}

function chipMark(status: 'same' | 'added' | 'removed') {
  if (status === 'added') return '+'
  if (status === 'removed') return '−'
  return '·'
}

function summarize(log: OperationLogEntry): string {
  if (isPeopleLog(log)) {
    const chips = buildPeopleChips(log)
    const added = chips.filter((c) => c.status === 'added')
    const removed = chips.filter((c) => c.status === 'removed')
    if (added.length) return `新增 ${added.map((c) => c.name).join('、')}`
    if (removed.length) return `删除 ${removed.map((c) => c.name).join('、')}`
    return chips.map((c) => c.name).join('、') || '人员变更'
  }
  if (isSessionLog(log)) {
    const s = (log.after_data ?? log.before_data) as Session | null
    if (s?.sessionNo) return `第 ${s.sessionNo} 场 · ${s.participants?.map((p) => p.name).join('、')}`
  }
  if (isRoundLog(log)) {
    const { sessionId, before, after } = getRoundSnapshot(log)
    const round = after ?? before
    if (round) return `第 ${sessionId} 场 第 ${round.roundNo} 局`
  }
  return TARGET_TYPE_LABELS[log.target_type] ?? ''
}

function openDetail(log: OperationLogEntry) {
  selected.value = log
  detailVisible.value = true
}

async function fetchLogs() {
  loading.value = true
  error.value = ''
  try {
    logs.value = await loadOperationLogs()
  } catch (e) {
    console.error(e)
    error.value = '加载失败，请确认已执行 create_history_operation_logs.sql'
    logs.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (open) => {
    if (open) void fetchLogs()
    else detailVisible.value = false
  },
)
</script>

<style lang="scss" scoped>
:deep(.history-log-modal) {
  --hl-bg: #151c28;
  --hl-card: #1e2838;
  --hl-card-hover: #243044;
  --hl-line: rgba(255, 255, 255, 0.1);
  --hl-text: #eef3fb;
  --hl-muted: #93a4bc;
  --hl-bad: #ff7b7b;
  background: var(--hl-bg) !important;
  color: var(--hl-text);
  border: 1px solid var(--hl-line);

  .modal-header {
    border-bottom-color: var(--hl-line);
  }

  .modal-title {
    color: var(--hl-text) !important;
  }

  .modal-close {
    color: var(--hl-muted) !important;

    &:hover {
      background: var(--hl-card) !important;
      color: var(--hl-text) !important;
    }
  }

  .modal-body {
    background: var(--hl-bg);
  }
}

.log-shell,
.detail-shell {
  --hl-bg: #151c28;
  --hl-card: #1e2838;
  --hl-card-hover: #243044;
  --hl-line: rgba(255, 255, 255, 0.1);
  --hl-text: #eef3fb;
  --hl-muted: #93a4bc;
  --hl-bad: #ff7b7b;
  color: var(--hl-text);
}

.state-box {
  padding: 56px 16px;
  text-align: center;
  color: var(--hl-muted);

  &.error {
    color: var(--hl-bad);
  }

  &.empty .empty-icon {
    display: block;
    font-size: 40px;
    margin-bottom: 10px;
    opacity: 0.6;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.log-card {
  width: 100%;
  text-align: left;
  border: 1px solid var(--hl-line);
  border-radius: 12px;
  background: var(--hl-card);
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  color: inherit;

  &:hover {
    background: var(--hl-card-hover);
    border-color: rgba(110, 168, 255, 0.35);
  }
}

.log-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.log-no {
  font-size: 12px;
  color: var(--hl-muted);
  font-family: ui-monospace, monospace;
}

.log-desc {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--hl-text);
}

.log-card-foot {
  font-size: 12px;
  color: var(--hl-muted);
  font-family: ui-monospace, monospace;

  .dot {
    margin: 0 6px;
    opacity: 0.5;
  }
}

.list-foot {
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--hl-muted);
  text-align: center;
}

.op-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.lg {
    font-size: 13px;
    padding: 5px 12px;
  }

  &.tone-add {
    background: rgba(61, 214, 140, 0.18);
    color: #6ee7a8;
  }

  &.tone-del {
    background: rgba(255, 123, 123, 0.18);
    color: #ff9b9b;
  }

  &.tone-edit {
    background: rgba(110, 168, 255, 0.18);
    color: #9ec5ff;
  }
}

.meta-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.meta-chip {
  padding: 5px 10px;
  border-radius: 8px;
  background: var(--hl-card);
  border: 1px solid var(--hl-line);
  font-size: 12px;
  color: var(--hl-muted);
  font-family: ui-monospace, monospace;
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.person-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--hl-line);

  .chip-mark {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }

  &.added {
    background: rgba(61, 214, 140, 0.12);
    border-color: rgba(61, 214, 140, 0.35);
    color: #8ef0b8;

    .chip-mark {
      background: rgba(61, 214, 140, 0.25);
      color: #3dd68c;
    }
  }

  &.removed {
    background: rgba(255, 123, 123, 0.12);
    border-color: rgba(255, 123, 123, 0.35);
    color: #ffb3b3;
    text-decoration: line-through;
    opacity: 0.85;

    .chip-mark {
      background: rgba(255, 123, 123, 0.25);
      color: #ff7b7b;
    }
  }

  &.same {
    background: var(--hl-card);
    color: var(--hl-muted);

    .chip-mark {
      background: rgba(255, 255, 255, 0.06);
      color: var(--hl-muted);
    }
  }
}

.legend {
  display: flex;
  gap: 16px;
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--hl-muted);

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .mark {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;

    &.add {
      background: #3dd68c;
    }

    &.del {
      background: #ff7b7b;
    }

    &.same {
      background: #5a6a82;
    }
  }
}

.diff-cols {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: stretch;

  &.raw {
    grid-template-columns: 1fr 1fr;
    margin-top: 10px;
  }
}

.diff-arrow {
  display: flex;
  align-items: center;
  color: var(--hl-muted);
  font-size: 18px;
  padding-top: 28px;
}

.diff-box {
  border-radius: 12px;
  border: 1px solid var(--hl-line);
  padding: 12px;
  min-height: 100px;

  &.before {
    background: rgba(255, 123, 123, 0.06);
    border-color: rgba(255, 123, 123, 0.2);
  }

  &.after {
    background: rgba(61, 214, 140, 0.06);
    border-color: rgba(61, 214, 140, 0.2);
  }
}

.diff-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--hl-muted);
  letter-spacing: 0.04em;
}

.empty-slot {
  padding: 20px 8px;
  text-align: center;
  color: var(--hl-muted);
  font-size: 13px;
}

.session-card {
  .session-line {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .session-sub {
    font-size: 13px;
    color: var(--hl-muted);
    line-height: 1.6;

    &.settled {
      color: #3dd68c;
    }
  }
}

.round-time {
  margin: -4px 0 12px;
  font-size: 13px;
  color: var(--hl-muted);
  font-family: ui-monospace, monospace;
}

.amount-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--hl-line);
    text-align: left;
  }

  th {
    font-size: 12px;
    color: var(--hl-muted);
    font-weight: 600;
  }

  .col-before {
    color: #ffb3b3;
    font-family: ui-monospace, monospace;
  }

  .col-after {
    color: #8ef0b8;
    font-family: ui-monospace, monospace;
  }

  tr.changed td {
    font-weight: 600;
  }

  td.cell-changed {
    background: rgba(110, 168, 255, 0.2);
    box-shadow: inset 0 0 0 1px rgba(110, 168, 255, 0.45);
  }
}

.raw-fold {
  summary {
    cursor: pointer;
    color: var(--hl-muted);
    font-size: 13px;
    user-select: none;
  }

  pre {
    margin: 0;
    padding: 12px;
    background: #0d1118;
    border: 1px solid var(--hl-line);
    border-radius: 8px;
    color: #c9d6ea;
    font-size: 12px;
    line-height: 1.5;
    max-height: 200px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@media (max-width: 768px) {
  .diff-cols {
    grid-template-columns: 1fr;

    .diff-arrow {
      display: none;
    }
  }
}
</style>
