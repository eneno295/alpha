<template>
  <div class="monopoly-page">
    <Header :show-log-icon="false" :show-fast-config-param="false" :show-theme-icon-param="false" />

    <div class="wrap">
      <header class="page-head">
        <div>
          <h1>大富翁 3D</h1>
          <p class="sub">多台手机同房间号联机 · 数据存 JSONBin</p>
          <p v-if="syncHint" class="sync-hint">{{ syncHint }}</p>
          <p v-if="errorMessage" class="error-hint">{{ errorMessage }}</p>
        </div>
      </header>

      <!-- 未进房：大厅 -->
      <section v-if="!room" class="card lobby-card">
        <h2>进入房间</h2>
        <label class="field">
          <span>房间号（好友填同一串）</span>
          <input v-model="roomCode" class="page-input" type="text" placeholder="例如 ABC123" />
        </label>
        <label class="field">
          <span>你的昵称</span>
          <input v-model="playerName" class="page-input" type="text" placeholder="玩家昵称" />
        </label>
        <div class="btn-row">
          <button class="btn primary" type="button" @click="handleEnter">加入房间</button>
          <button class="btn" type="button" @click="handleCreate">创建房间</button>
        </div>
        <p class="hint">创建后把房间号发给其他人；每人用自己的手机打开本页并加入。</p>
      </section>

      <template v-else>
        <section class="card info-card">
          <div class="room-bar">
            <span class="room-code">房间 {{ roomCode }}</span>
            <button class="btn sm" type="button" @click="handleRefresh">刷新</button>
          </div>
          <ul class="player-list">
            <li
              v-for="(p, i) in room.players"
              :key="i"
              :class="{
                active: room.phase === 'playing' && room.currentPlayerIndex === i,
                me: i === mySlotIndex,
              }"
            >
              <span v-if="p" class="dot" :style="{ background: p.color }" />
              <template v-if="p">
                {{ p.name }}
                <span v-if="i === mySlotIndex">（我）</span>
                · ¥{{ p.money }} · 格 {{ p.position }}
              </template>
              <span v-else class="empty-slot">空位</span>
            </li>
          </ul>
          <p v-if="room.lastDice" class="dice-line">
            上次骰子：{{ room.lastDice[0] }} + {{ room.lastDice[1] }} =
            {{ room.lastDice[0] + room.lastDice[1] }}
          </p>
          <p v-if="isReadOnly" class="readonly-hint">
            当前为观战模式：仅 {{ currentPlayerName }} 可操作，你只需等待自动同步
          </p>
        </section>

        <section class="board-card">
          <MonopolyBoard3D :room="room" />
        </section>

        <section class="card action-card">
          <template v-if="room.phase === 'lobby'">
            <p v-if="isHost" class="hint">你是房主，人满后点开始。</p>
            <p v-else class="hint">等待房主开始游戏…</p>
            <button v-if="isHost" class="btn primary full" type="button" @click="handleStart">
              开始游戏
            </button>
          </template>
          <template v-else-if="room.phase === 'playing'">
            <p v-if="isMyTurn" class="turn-tip">轮到你掷骰子</p>
            <p v-else class="turn-tip muted">等待 {{ currentPlayerName }}…</p>
            <button
              class="btn primary full"
              type="button"
              :disabled="!isMyTurn || isRolling"
              @click="handleRoll"
            >
              {{ isRolling ? '掷骰中…' : '掷骰子' }}
            </button>
          </template>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Header from '@/components/common/Header.vue'
import MonopolyBoard3D from './components/MonopolyBoard3D.vue'
import { isMyTurn as checkMyTurn } from './monopolyState'
import { useMonopolyRoom } from './useMonopolyRoom'

const {
  clientId,
  roomCode,
  playerName,
  room,
  mySlotIndex,
  syncStatus,
  errorMessage,
  enterRoom,
  createAndEnter,
  hostStart,
  roll,
  pullRoom,
  persistLocal,
  isReadOnly,
} = useMonopolyRoom()

const isRolling = ref(false)

const isHost = computed(() => room.value?.hostClientId === clientId)
const isMyTurn = computed(() => (room.value ? checkMyTurn(room.value, clientId) : false))

const currentPlayerName = computed(() => {
  const r = room.value
  if (!r) return ''
  const p = r.players[r.currentPlayerIndex]
  return p?.name ?? '玩家'
})

const syncHint = computed(() => {
  const map = {
    idle: '',
    loading: '同步中…',
    syncing: '保存中…',
    ok: '已同步',
    error: '同步异常',
  } as const
  return map[syncStatus.value]
})

async function handleEnter() {
  persistLocal()
  try {
    await enterRoom()
  } catch {
    /* errorMessage 已设置 */
  }
}

async function handleCreate() {
  persistLocal()
  try {
    await createAndEnter()
  } catch {
    /* noop */
  }
}

async function handleStart() {
  try {
    await hostStart()
  } catch {
    /* noop */
  }
}

async function handleRoll() {
  if (!isMyTurn.value || isRolling.value) return
  isRolling.value = true
  try {
    await roll()
  } finally {
    isRolling.value = false
  }
}

function handleRefresh() {
  void pullRoom()
}
</script>

<style lang="scss" scoped>
:deep(.header) {
  --header-bg: var(--bg);
}

.monopoly-page {
  --bg: #0a0f1a;
  --card: #141c2b;
  --text: #e8edf5;
  --muted: #8b9cb3;
  --line: rgba(255, 255, 255, 0.08);
  --accent: #f59e0b;
  --bad: #f87171;
  min-height: 100vh;
  background:
    radial-gradient(900px 500px at 100% 0%, rgba(245, 158, 11, 0.12), transparent), var(--bg);
  color: var(--text);
}

.wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 12px 40px;
}

.page-head {
  margin-bottom: 16px;

  h1 {
    margin: 0 0 4px;
    font-size: 24px;
  }

  .sub {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }

  .sync-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--accent);
  }

  .error-hint {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--bad);
  }
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;

  h2 {
    margin: 0 0 12px;
    font-size: 16px;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--muted);
}

.page-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  font-size: 15px;
}

.btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
  font-size: 14px;

  &.primary {
    border-color: var(--accent);
    background: rgba(245, 158, 11, 0.2);
  }

  &.sm {
    padding: 4px 10px;
    font-size: 12px;
  }

  &.full {
    width: 100%;
    margin-top: 8px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;

  &.warn {
    color: #fbbf24;
  }

  code {
    font-size: 11px;
    color: #fde68a;
  }
}

.room-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.room-code {
  font-weight: 700;
  letter-spacing: 0.08em;
}

.player-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;

    &.active {
      color: var(--accent);
      font-weight: 600;
    }

    &.me {
      opacity: 1;
    }
  }
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.empty-slot {
  color: var(--muted);
}

.dice-line {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--accent);
}

.readonly-hint {
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.45;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.board-card {
  height: min(58vh, 480px);
  margin-bottom: 12px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #0b1220;
}

.turn-tip {
  margin: 0 0 8px;
  text-align: center;
  font-weight: 600;

  &.muted {
    color: var(--muted);
    font-weight: 400;
  }
}
</style>
