<template>
  <div class="history-page">
    <Header :show-log-icon="false" :show-fast-config-param="false" :show-theme-icon-param="false" />

    <div class="wrap">
      <header class="page-head">
        <div>
          <h1>输赢记录</h1>
          <p class="sub">按场次记录每一局，数据同步至云端</p>
          <p v-if="syncHint" class="sync-hint">{{ syncHint }}</p>
        </div>
        <button
          class="btn primary"
          type="button"
          :disabled="!people.length"
          @click="handleNewSession"
        >
          + 新建一场
        </button>
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
        <article v-for="session in displaySessions" :key="session.id" class="card session-card">
          <div class="session-head">
            <div class="session-title">
              <h2>第 {{ session.sessionNo }} 场</h2>
              <time>{{ formatSessionDateTime(session.time) }}</time>
            </div>
            <div class="session-actions">
              <button
                class="btn sm"
                type="button"
                :disabled="!people.length"
                @click="openRoundCreate(session.id)"
              >
                + 加一局
              </button>
              <button class="btn sm danger" type="button" @click="confirmRemoveSession(session.id)">
                删除场次
              </button>
            </div>
          </div>

          <div v-if="!session.rounds.length" class="empty-tip">本场暂无记录，点击「加一局」</div>

          <div v-else class="table-wrap">
            <table class="score-table">
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
                  <td class="col-time time-cell">{{ formatDateTime(round.time) }}</td>
                  <td
                    v-for="p in getSessionParticipants(session)"
                    :key="p.personId"
                    class="col-score"
                    :class="amountClass(scoreForRound(round, p.name))"
                  >
                    {{ formatAmount(scoreForRound(round, p.name)) }}
                  </td>
                  <td class="col-ops ops">
                    <button class="link" type="button" @click="openRoundEdit(session.id, round)">
                      修改
                    </button>
                    <button
                      class="link danger"
                      type="button"
                      @click="removeRound(session.id, round.id)"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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
          记录时间：{{ formatDateTime(roundEditTime) }}
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
        </div>
        <p class="sum-check" :class="roundAmountBalanced ? 'ok' : 'bad'">
          <template v-if="roundAmountBalanced">本局合计平衡（所有人相加为 0）</template>
          <template v-else>
            本局合计：{{ formatAmount(roundAmountSum) }}（应为 0，输赢总数对不上）
          </template>
        </p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Header from '@/components/binance/Header.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { num } from './historyState'
import { getSessionParticipants, useGameHistory } from './useGameHistory'
import type { Round, Session, SessionParticipant } from './type'

const {
  people,
  sessions,
  syncStatus,
  addPerson,
  removePerson,
  addSession,
  removeSession,
  addRound,
  updateRound,
  removeRound,
  sessionTotals,
  scoreForRound,
} = useGameHistory()

const newPersonName = ref('')
const roundModalParticipants = ref<SessionParticipant[]>([])

const displaySessions = computed(() => [...sessions.value].reverse())

function displayRounds(session: Session): Round[] {
  return [...session.rounds].reverse()
}

const roundModal = reactive({
  visible: false,
  isNew: false,
  sessionId: '',
  roundId: '',
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
}

function confirmRemoveSession(sessionId: string) {
  if (window.confirm('确定删除这一场及其中所有局？')) removeSession(sessionId)
}

function nowIso(): string {
  return new Date().toISOString()
}

function openRoundEdit(sessionId: string, round: Round) {
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session) return
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

function openRoundCreate(sessionId: string) {
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session) return
  roundModalParticipants.value = getSessionParticipants(session)
  roundModal.visible = true
  roundModal.isNew = true
  roundModal.sessionId = sessionId
  roundModal.roundId = ''
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
      time: nowIso(),
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

/** 场次时间：年月日 + 时分 */
function formatSessionDateTime(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  margin-bottom: 12px;
}

.session-title {
  h2 {
    margin: 0 0 4px;
    font-size: 18px;
  }

  time {
    color: var(--muted);
    font-size: 12px;
  }
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

  .col-no,
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
