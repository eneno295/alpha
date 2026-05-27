import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { patchMonopolyRoom, fetchMonopolyRoot } from '@/api/monopolyBin'
import type { MonopolyWriteAction } from './monopolyState'
import {
  applyRoll,
  assertCanWrite,
  createRoom,
  findPlayerIndex,
  getClientId,
  isMyTurn,
  isReadOnlyClient,
  joinPlayerSlot,
  startGame,
} from './monopolyState'
import type { MonopolyRoom } from './type'

const POLL_MS = 2000

export function useMonopolyRoom() {
  const clientId = getClientId()
  const roomCode = ref('')
  const playerName = ref('')
  const room = shallowRef<MonopolyRoom | null>(null)
  const syncStatus = ref<'idle' | 'loading' | 'syncing' | 'ok' | 'error'>('idle')
  const errorMessage = ref('')
  const mySlotIndex = ref(-1)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let isWriting = false

  const isReadOnly = computed(() =>
    room.value ? isReadOnlyClient(room.value, clientId) : false,
  )

  function updateMySlot(r: MonopolyRoom | null) {
    mySlotIndex.value = r ? findPlayerIndex(r, clientId) : -1
  }

  async function pullRoom(silent = false) {
    if (!roomCode.value.trim()) return
    if (!silent) syncStatus.value = 'loading'
    try {
      const root = await fetchMonopolyRoot()
      const code = roomCode.value.trim().toUpperCase()
      const r = root.rooms[code] ?? null
      room.value = r
      updateMySlot(r)
      if (!silent) syncStatus.value = 'ok'
      errorMessage.value = ''
    } catch (e) {
      console.error(e)
      syncStatus.value = 'error'
      errorMessage.value = '同步失败，请检查网络或 JSONBin 配置'
    }
  }

  function startPolling() {
    stopPolling()
    pollTimer = setInterval(() => {
      if (!isWriting) void pullRoom(true)
    }, POLL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  async function runPatch(
    action: MonopolyWriteAction,
    mutator: (room: MonopolyRoom | undefined) => MonopolyRoom,
  ) {
    const code = roomCode.value.trim().toUpperCase()
    if (!code) throw new Error('请输入房间号')

    // 客户端先拦一道，避免非回合玩家发起 PUT
    assertCanWrite(room.value ?? undefined, clientId, action)

    isWriting = true
    syncStatus.value = 'syncing'
    try {
      const expected = room.value?.version
      const next = await patchMonopolyRoom(code, clientId, action, mutator, expected)
      room.value = next
      updateMySlot(next)
      syncStatus.value = 'ok'
      errorMessage.value = ''
    } catch (e) {
      const msg = e instanceof Error ? e.message : '操作失败'
      errorMessage.value = msg
      syncStatus.value = 'error'
      await pullRoom(true)
      throw e
    } finally {
      isWriting = false
    }
  }

  /** 已在房间内的玩家：只拉取，不 PUT */
  async function reconnectRoom(existing: MonopolyRoom) {
    room.value = existing
    updateMySlot(existing)
    syncStatus.value = 'ok'
    errorMessage.value = ''
    startPolling()
    persistLocal()
  }

  async function enterRoom() {
    const code = roomCode.value.trim().toUpperCase()
    if (!code) {
      errorMessage.value = '请输入房间号'
      return
    }

    syncStatus.value = 'loading'
    try {
      const root = await fetchMonopolyRoot()
      const existing = root.rooms[code]

      if (existing && findPlayerIndex(existing, clientId) >= 0) {
        await reconnectRoom(existing)
        return
      }

      await runPatch('join', (current) => {
        const base = current ?? createRoom(clientId)
        return joinPlayerSlot(base, clientId, playerName.value)
      })
      startPolling()
      persistLocal()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '进入房间失败'
      errorMessage.value = msg
      syncStatus.value = 'error'
    }
  }

  async function createAndEnter() {
    roomCode.value = Math.random().toString(36).slice(2, 8).toUpperCase()
    await enterRoom()
  }

  async function hostStart() {
    await runPatch('start', (existing) => {
      if (!existing) throw new Error('房间不存在')
      return startGame(existing, clientId)
    })
  }

  async function roll() {
    if (!room.value || !isMyTurn(room.value, clientId)) {
      throw new Error('还没轮到你')
    }
    await runPatch('roll', (existing) => {
      if (!existing) throw new Error('房间不存在')
      return applyRoll(existing, clientId)
    })
  }

  onMounted(() => {
    const savedCode = localStorage.getItem('monopoly-room-code')
    const savedName = localStorage.getItem('monopoly-player-name')
    if (savedCode) roomCode.value = savedCode
    if (savedName) playerName.value = savedName
  })

  onUnmounted(() => {
    stopPolling()
  })

  function persistLocal() {
    localStorage.setItem('monopoly-room-code', roomCode.value.trim().toUpperCase())
    localStorage.setItem('monopoly-player-name', playerName.value.trim())
  }

  return {
    clientId,
    roomCode,
    playerName,
    room,
    mySlotIndex,
    isReadOnly,
    syncStatus,
    errorMessage,
    enterRoom,
    createAndEnter,
    hostStart,
    roll,
    pullRoom,
    startPolling,
    stopPolling,
    persistLocal,
  }
}
