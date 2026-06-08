import { onMounted, ref, watch } from 'vue'
import { fetchHistoryFromAPI, updateHistoryInAPI } from '@/api/historyBin'
import {
  getSessionParticipants,
  normalizeState,
  renumberRounds,
  renumberSessions,
  sessionTotals,
  scoreForRound,
  snapshotParticipants,
  uid,
} from './historyState'
import type { GameHistoryState, Person, Round, Session } from './type'

const SYNC_DEBOUNCE_MS = 600

function nowIso(): string {
  return new Date().toISOString()
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
    renumberSessions(sessions.value)
  }

  function currentState(): GameHistoryState {
    return { people: people.value, sessions: sessions.value }
  }

  async function syncToRemote() {
    syncStatus.value = 'saving'
    try {
      await updateHistoryInAPI(currentState())
      syncStatus.value = 'saved'
    } catch (error) {
      console.error('输赢记录同步失败:', error)
      syncStatus.value = 'error'
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
    try {
      const remote = normalizeState(await fetchHistoryFromAPI())
      applyState(remote)
      syncStatus.value = 'saved'
    } catch (error) {
      console.error('输赢记录拉取失败:', error)
      syncStatus.value = 'error'
    } finally {
      isHydrating = false
    }
  }

  watch(
    [people, sessions],
    () => {
      if (isHydrating) return
      scheduleSync()
    },
    { deep: true },
  )

  onMounted(() => {
    localStorage.removeItem('game-history-v2')
    localStorage.removeItem('game-history-v1')
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
