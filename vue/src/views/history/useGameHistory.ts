import { onMounted, ref, watch } from 'vue'
import { fetchHistoryFromAPI, updateHistoryInAPI } from '@/api/historyBin'
import {
  getSessionParticipants,
  hasData,
  normalizeState,
  renumberRounds,
  renumberSessions,
  sessionTotals,
  scoreForRound,
  snapshotParticipants,
  uid,
} from './historyState'
import type { GameHistoryState, Person, Round, Session } from './type'

const STORAGE_KEY = 'game-history-v2'
const SYNC_DEBOUNCE_MS = 600

function nowIso(): string {
  return new Date().toISOString()
}

function loadLocalState(): GameHistoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { people: [], sessions: [] }
    return normalizeState(JSON.parse(raw))
  } catch {
    return { people: [], sessions: [] }
  }
}

function saveLocalState(state: GameHistoryState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export { getSessionParticipants, sessionTotals, scoreForRound } from './historyState'

export function useGameHistory() {
  const people = ref<Person[]>([])
  const sessions = ref<Session[]>([])
  const syncStatus = ref<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')

  let isHydrating = false
  let syncTimer: ReturnType<typeof setTimeout> | null = null

  function applyState(state: GameHistoryState) {
    const normalized = normalizeState(state)
    people.value = normalized.people
    sessions.value = normalized.sessions
  }

  function currentState(): GameHistoryState {
    return { people: people.value, sessions: sessions.value }
  }

  async function syncToRemote() {
    syncStatus.value = 'saving'
    try {
      const state = currentState()
      await updateHistoryInAPI(state)
      saveLocalState(state)
      syncStatus.value = 'saved'
    } catch (error) {
      console.error('输赢记录同步失败:', error)
      syncStatus.value = 'error'
      saveLocalState(currentState())
    }
  }

  function scheduleSync() {
    if (isHydrating) return
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      syncTimer = null
      void syncToRemote()
    }, SYNC_DEBOUNCE_MS)
  }

  async function loadFromRemote() {
    syncStatus.value = 'loading'
    isHydrating = true
    let remoteOk = false
    let remote: GameHistoryState = { people: [], sessions: [] }

    try {
      remote = normalizeState(await fetchHistoryFromAPI())
      remoteOk = true
    } catch (error) {
      console.error('输赢记录拉取失败，使用本地缓存:', error)
    }

    const local = loadLocalState()

    if (remoteOk && hasData(remote)) {
      applyState(remote)
      saveLocalState(remote)
    } else if (hasData(local)) {
      applyState(local)
      if (remoteOk) await syncToRemote()
    } else {
      applyState(remoteOk ? remote : local)
    }

    isHydrating = false
    syncStatus.value = remoteOk || hasData(local) ? 'saved' : 'idle'
  }

  watch(
    [people, sessions],
    () => {
      if (isHydrating) return
      saveLocalState(currentState())
      scheduleSync()
    },
    { deep: true },
  )

  onMounted(() => {
    void loadFromRemote()
  })

  function addPerson(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return false
    if (people.value.some((p) => p.name === trimmed)) return false
    people.value.push({ id: uid(), name: trimmed })
    return true
  }

  function removePerson(personId: string) {
    people.value = people.value.filter((p) => p.id !== personId)
  }

  function addSession() {
    sessions.value.unshift({
      id: uid(),
      sessionNo: sessions.value.length + 1,
      time: nowIso(),
      participants: snapshotParticipants(people.value),
      rounds: [],
    })
    renumberSessions(sessions.value)
    return sessions.value[0]?.id
  }

  function removeSession(sessionId: string) {
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)
    renumberSessions(sessions.value)
  }

  function addRound(sessionId: string, patch: Pick<Round, 'roundNo' | 'time' | 'amounts'>) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    session.rounds.push({
      id: uid(),
      roundNo: patch.roundNo,
      time: patch.time,
      amounts: { ...patch.amounts },
    })
    renumberRounds(session)
  }

  function updateRound(sessionId: string, roundId: string, patch: Partial<Pick<Round, 'roundNo' | 'time' | 'amounts'>>) {
    const session = sessions.value.find((s) => s.id === sessionId)
    const round = session?.rounds.find((r) => r.id === roundId)
    if (!round) return
    Object.assign(round, patch)
    if (patch.amounts) round.amounts = { ...patch.amounts }
  }

  function removeRound(sessionId: string, roundId: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    session.rounds = session.rounds.filter((r) => r.id !== roundId)
    renumberRounds(session)
  }

  return {
    people,
    sessions,
    syncStatus,
    loadFromRemote,
    addPerson,
    removePerson,
    addSession,
    removeSession,
    addRound,
    updateRound,
    removeRound,
    sessionTotals,
    scoreForRound,
    getSessionParticipants,
  }
}
