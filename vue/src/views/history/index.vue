<template>
  <div class="history-page">
    <Header :show-fast-config-param="false" :show-theme-icon-param="false" />

    <div class="wrap">
      <header class="page-head">
        <div>
          <h1>输赢记录</h1>
          <p class="sub">按场次记录每一局，数据同步至云端</p>
          <p v-if="syncHint" class="sync-hint">{{ syncHint }}</p>
        </div>
        <div class="page-head-actions">
          <button class="btn" type="button" title="操作日志" @click="showLogModal = true">
            📋 日志
          </button>
          <button
            class="btn primary"
            type="button"
            :disabled="!people.length"
            @click="handleNewSession"
          >
            + 新建一场
          </button>
        </div>
      </header>

      <section class="card people-card">
        <h2>参与人员</h2>
        <div class="people-row">
          <input
            v-model="newPersonName"
            class="page-input"
            type="text"
            placeholder="输入姓名后回车或点添加"
            @keyup.enter="handleAddPerson"
          />
          <button class="btn" type="button" @click="handleAddPerson">添加人员</button>
        </div>
        <div v-if="people.length" class="chips">
          <span v-for="p in people" :key="p.id" class="chip">
            {{ p.name }}
            <button type="button" class="chip-del" title="移除" @click="removePerson(p.id)">
              ×
            </button>
          </span>
        </div>
        <p v-else class="empty-tip">请先添加至少一名参与人员</p>
        <p v-if="people.length" class="people-hint">
          增删人员只影响之后「新建一场」；已有场次的人员与记录不会变。
        </p>
      </section>

      <section v-if="displaySessions.length" class="sessions">
        <article
          v-for="session in displaySessions"
          :key="session.id"
          class="card session-card"
          :class="{ collapsed: !isSessionExpanded(session.id) }"
        >
          <div class="session-head">
            <button
              type="button"
              class="session-toggle"
              :aria-expanded="isSessionExpanded(session.id)"
              @click="toggleSessionExpand(session.id)"
            >
              <span class="chevron" :class="{ open: isSessionExpanded(session.id) }">▸</span>
              <div class="session-title">
                <h2>
                  第 {{ session.sessionNo }} 场
                  <span v-if="session.settled" class="settled-badge">已结清</span>
                </h2>
                <time>{{ formatDisplayDateTime(session.time) }}</time>
                <time v-if="session.settled && session.settledAt" class="settled-time">
                  结清于 {{ formatDisplayDateTime(session.settledAt) }}
                </time>
              </div>
            </button>
            <div class="session-actions">
              <button
                v-if="!session.settled"
                class="btn sm settle"
                type="button"
                @click="confirmSettleSession(session.id)"
              >
                结清
              </button>
              <button
                class="btn sm"
                type="button"
                :disabled="!people.length || session.settled"
                @click="openRoundCreate(session.id)"
              >
                + 加一局
              </button>
              <button class="btn sm danger" type="button" @click="confirmRemoveSession(session.id)">
                删除场次
              </button>
            </div>
          </div>

          <div v-show="isSessionExpanded(session.id)" class="session-body">
            <div v-if="!session.rounds.length" class="empty-tip">本场暂无记录，点击「加一局」</div>

            <div v-else class="table-wrap">
              <table class="score-table">
                <colgroup>
                  <col class="col-no" />
                  <col class="col-time" />
                  <col
                    v-for="p in getSessionParticipants(session)"
                    :key="p.personId"
                    class="col-score"
                  />
                  <col class="col-ops" />
                </colgroup>
                <thead>
                  <tr class="total-row">
                    <td class="col-no">本场合计</td>
                    <td class="col-time"></td>
                    <td
                      v-for="p in getSessionParticipants(session)"
                      :key="p.personId"
                      class="col-score"
                      :class="amountClass(sessionTotals(session)[p.name])"
                    >
                      {{ formatAmount(sessionTotals(session)[p.name]) }}
                    </td>
                    <td class="col-ops"></td>
                  </tr>
                  <tr>
                    <th class="col-no">局号</th>
                    <th class="col-time">时间</th>
                    <th
                      v-for="p in getSessionParticipants(session)"
                      :key="p.personId"
                      class="col-score"
                    >
                      {{ p.name }}
                    </th>
                    <th class="col-ops">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="round in displayRounds(session)" :key="round.id">
                    <td class="col-no">第 {{ round.roundNo }} 局</td>
                    <td class="col-time time-cell">
                      {{ formatDisplayDateTime(round.time, false) }}
                    </td>
                    <td
                      v-for="p in getSessionParticipants(session)"
                      :key="p.personId"
                      class="col-score"
                      :class="amountClass(scoreForRound(round, p.name))"
                    >
                      {{ formatAmount(scoreForRound(round, p.name)) }}
                    </td>
                    <td class="col-ops ops">
                      <template v-if="!session.settled">
                        <button
                          class="link"
                          type="button"
                          @click="openRoundEdit(session.id, round)"
                        >
                          修改
                        </button>
                        <button
                          class="link danger"
                          type="button"
                          @click="removeRound(session.id, round.id)"
                        >
                          删除
                        </button>
                      </template>
                      <span v-else class="muted-ops">已结清</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <p v-else-if="people.length" class="empty-tip center">还没有场次，点击「新建一场」开始记录</p>
    </div>

    <BaseModal
      :visible="roundModal.visible"
      :title="roundModal.isNew ? '新增一局' : '修改本局'"
      confirm-text="保存"
      @close="closeRoundModal"
      @confirm="saveRoundModal"
    >
      <div class="modal-form">
        <label class="field">
          <span>局号</span>
          <input
            v-model.number="roundDraft.roundNo"
            class="modal-input"
            type="number"
            min="1"
            step="1"
          />
        </label>
        <p v-if="!roundModal.isNew && roundEditTime" class="time-readonly">
          记录时间：{{ formatDisplayDateTime(roundEditTime, false) }}
        </p>
        <div v-for="p in roundModalParticipants" :key="p.personId" class="field">
          <span>{{ p.name }}（正数赢 / 负数输）</span>
          <input
            :value="amountInputValue(p.name)"
            class="modal-input"
            type="text"
            placeholder="0"
            @input="setAmountInput(p.name, ($event.target as HTMLInputElement).value)"
          />
          <div class="amount-shortcuts">
            <button
              v-for="v in amountShortcuts"
              :key="v"
              type="button"
              class="amount-shortcut"
              :class="{ win: v > 0, lose: v < 0 }"
              @click="setAmountInput(p.name, String(v))"
            >
              {{ v > 0 ? `+${v}` : v }}
            </button>
          </div>
        </div>
        <p class="sum-check" :class="roundAmountBalanced ? 'ok' : 'bad'">
          <template v-if="roundAmountBalanced">本局合计平衡（所有人相加为 0）</template>
          <template v-else>
            本局合计：{{ formatAmount(roundAmountSum) }}（应为 0，输赢总数对不上）
          </template>
        </p>
      </div>
    </BaseModal>

    <HistoryLogModal :visible="showLogModal" @close="showLogModal = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Header from '@/components/common/Header.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import HistoryLogModal from './components/HistoryLogModal.vue'
import { formatDisplayDateTime, formatStorageDateTime, num } from './utils/historyState'
import { getSessionParticipants, useGameHistory } from './composables/useGameHistory'
import type { Round, Session, SessionParticipant } from './types'

const {
  people,
  sessions,
  syncStatus,
  addPerson,
  removePerson,
  addSession,
  removeSession,
  settleSession,
  addRound,
  updateRound,
  removeRound,
  sessionTotals,
  scoreForRound,
} = useGameHistory()

const newPersonName = ref('')
const showLogModal = ref(false)
const roundModalParticipants = ref<SessionParticipant[]>([])
const amountShortcuts = [10, 20, 40, 80, -10, -20, -40, -80]

const displaySessions = computed(() => sessions.value)

const expandedSessionIds = ref<Set<number>>(new Set())
let expandedInitialized = false

function expandLatestOnly() {
  const latest = displaySessions.value[0]
  expandedSessionIds.value = latest ? new Set([latest.id]) : new Set()
}

function isSessionExpanded(sessionId: number): boolean {
  return expandedSessionIds.value.has(sessionId)
}

function toggleSessionExpand(sessionId: number) {
  const next = new Set(expandedSessionIds.value)
  if (next.has(sessionId)) next.delete(sessionId)
  else next.add(sessionId)
  expandedSessionIds.value = next
}

watch(
  () => sessions.value.length,
  (len) => {
    if (len === 0) {
      expandedSessionIds.value = new Set()
      expandedInitialized = false
      return
    }
    if (!expandedInitialized) {
      expandedInitialized = true
      expandLatestOnly()
    }
  },
  { immediate: true },
)

function displayRounds(session: Session): Round[] {
  return [...session.rounds].reverse()
}

const roundModal = reactive({
  visible: false,
  isNew: false,
  sessionId: 0,
  roundId: 0,
})

const roundDraft = reactive({
  roundNo: 1,
  amountInputs: {} as Record<string, string>,
})

const roundEditTime = ref('')

function parseAmountInput(name: string): number {
  const text = (roundDraft.amountInputs[name] ?? '').trim()
  if (text === '' || text === '-' || text === '+') return 0
  const n = Number(text)
  return Number.isFinite(n) ? n : 0
}

const roundAmountSum = computed(() =>
  roundModalParticipants.value.reduce((sum, p) => sum + parseAmountInput(p.name), 0),
)

const roundAmountBalanced = computed(() => Math.abs(roundAmountSum.value) < 1e-6)

const syncHint = computed(() => {
  const map: Record<typeof syncStatus.value, string> = {
    idle: '',
    loading: '正在加载…',
    saving: '正在保存…',
    saved: '已同步',
    error: '同步失败，请检查网络后刷新',
  }
  return map[syncStatus.value]
})

function handleAddPerson() {
  if (!addPerson(newPersonName.value)) {
    window.alert('姓名不能为空，且不能重复')
    return
  }
  newPersonName.value = ''
}

function handleNewSession() {
  addSession()
  expandLatestOnly()
}

function confirmRemoveSession(sessionId: number) {
  if (window.confirm('确定删除这一场及其中所有局？')) {
    removeSession(sessionId)
    expandLatestOnly()
  }
}

function confirmSettleSession(sessionId: number) {
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session || session.settled) return
  if (
    window.confirm(
      `确定将「第 ${session.sessionNo} 场」标记为已结清吗？结清后将不能再新增或修改局记录。`,
    )
  ) {
    settleSession(sessionId)
  }
}

function openRoundEdit(sessionId: number, round: Round) {
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session || session.settled) return
  roundModalParticipants.value = getSessionParticipants(session)
  roundModal.visible = true
  roundModal.isNew = false
  roundModal.sessionId = sessionId
  roundModal.roundId = round.id
  roundDraft.roundNo = round.roundNo
  roundEditTime.value = round.time
  roundDraft.amountInputs = {}
  roundModalParticipants.value.forEach((p) => {
    const v = scoreForRound(round, p.name)
    roundDraft.amountInputs[p.name] = v ? String(v) : ''
  })
}

function openRoundCreate(sessionId: number) {
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session || session.settled) return
  roundModalParticipants.value = getSessionParticipants(session)
  roundModal.visible = true
  roundModal.isNew = true
  roundModal.sessionId = sessionId
  roundModal.roundId = 0
  roundDraft.roundNo = session.rounds.length + 1
  roundEditTime.value = ''
  roundDraft.amountInputs = Object.fromEntries(
    roundModalParticipants.value.map((p) => [p.name, '']),
  )
}

function closeRoundModal() {
  roundModal.visible = false
  roundModal.isNew = false
}

function saveRoundModal() {
  if (!roundAmountBalanced.value) {
    window.alert(
      `本局合计为 ${formatAmount(roundAmountSum.value)}，所有人金额相加必须为 0（有人赢就要有人输）。请调整后再保存。`,
    )
    return
  }
  const amounts: Record<string, number> = {}
  roundModalParticipants.value.forEach((p) => {
    amounts[p.name] = parseAmountInput(p.name)
  })
  const roundNo = Math.max(1, Math.floor(num(roundDraft.roundNo)))
  if (roundModal.isNew) {
    addRound(roundModal.sessionId, {
      roundNo,
      time: formatStorageDateTime(),
      amounts,
    })
  } else {
    updateRound(roundModal.sessionId, roundModal.roundId, {
      roundNo,
      amounts,
    })
  }
  roundModal.visible = false
  roundModal.isNew = false
}

function formatAmount(v: number): string {
  if (!v) return '0'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}

function amountInputValue(name: string): string {
  return roundDraft.amountInputs[name] ?? ''
}

function setAmountInput(name: string, raw: string) {
  roundDraft.amountInputs[name] = raw
}

function amountClass(v: number): string {
  if (v > 0) return 'win'
  if (v < 0) return 'lose'
  return ''
}
</script>

<style lang="scss" scoped>
:deep(.header) {
  --header-bg: var(--bg);
}

.history-page {
  --bg: #0f1419;
  --card: #1a2332;
  --text: #e8edf5;
  --muted: #8b9cb3;
  --line: rgba(255, 255, 255, 0.08);
  --accent: #6ea8ff;
  --ok: #3dd68c;
  --bad: #ff6b6b;
  min-height: 100vh;
  background:
    radial-gradient(900px 500px at 100% 0%, rgba(110, 168, 255, 0.12), transparent), var(--bg);
  color: var(--text);
}

.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;

  h1 {
    margin: 0 0 6px;
    font-size: 26px;
  }

  .sub {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }

  .sync-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--accent);
  }

  .page-head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 12px;
    font-size: 16px;
  }
}

.people-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.page-input {
  flex: 1;
  min-width: 160px;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text);
  font-size: 14px;
}

.btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;

  &.primary {
    border-color: var(--accent);
    background: rgba(110, 168, 255, 0.2);
  }

  &.sm {
    padding: 4px 10px;
    font-size: 12px;
  }

  &.danger {
    color: var(--bad);
  }

  &.settle {
    border-color: rgba(61, 214, 140, 0.45);
    color: var(--ok);
    background: rgba(61, 214, 140, 0.12);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(110, 168, 255, 0.15);
  font-size: 13px;
}

.chip-del {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;

  &:hover {
    color: var(--bad);
  }
}

.session-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.session-card.collapsed .session-head {
  margin-bottom: 0;
}

.session-toggle {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover .session-title h2 {
    color: var(--accent);
  }
}

.chevron {
  flex-shrink: 0;
  margin-top: 4px;
  color: var(--muted);
  font-size: 20px;
  line-height: 1;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(90deg);
  }
}

.session-body {
  margin-top: 12px;
}

.session-title {
  h2 {
    margin: 0 0 4px;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  time {
    display: block;
    color: var(--muted);
    font-size: 12px;
  }

  .settled-time {
    margin-top: 2px;
    color: var(--ok);
  }
}

.settled-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ok);
  background: rgba(61, 214, 140, 0.15);
  border: 1px solid rgba(61, 214, 140, 0.35);
}

.muted-ops {
  color: var(--muted);
  font-size: 12px;
}

.session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.people-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.table-wrap {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.score-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;

  .col-no {
    width: 80px;
    text-align: center;
  }

  .col-time {
    width: 60px;
  }

  .col-score {
    width: 50px;
  }

  .col-ops {
    width: 100px;
  }

  th,
  td {
    padding: 10px 2px;
    border-bottom: 1px solid var(--line);
    vertical-align: middle;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-time {
    text-align: left;
  }

  .col-score {
    text-align: right;
  }

  .col-ops {
    text-align: center;
  }
}

.total-row {
  font-weight: 700;
  background: rgba(255, 255, 255, 0.03);
}

.time-cell {
  color: var(--muted);
  font-size: 12px;
}

.ops {
  text-align: center !important;
}

.link {
  border: none;
  background: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;

  &.danger {
    color: var(--bad);
  }
}

.win {
  color: var(--ok);
}

.lose {
  color: var(--bad);
}

.empty-tip {
  margin: 0;
  color: var(--muted);
  font-size: 13px;

  &.center {
    text-align: center;
    padding: 24px;
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-form .field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #6c757d;
}

.modal-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #212529;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
}

.amount-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.amount-shortcut {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: #f8f9fa;
  color: #495057;
  font-size: 12px;
  cursor: pointer;

  &.win {
    color: #047857;
    border-color: #a7f3d0;
    background: #ecfdf5;
  }

  &.lose {
    color: #b91c1c;
    border-color: #fecaca;
    background: #fef2f2;
  }

  &:hover {
    filter: brightness(0.96);
  }
}

.time-readonly {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
}

.sum-check {
  margin: 4px 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;

  &.ok {
    color: #047857;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
  }

  &.bad {
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
  }
}
</style>
