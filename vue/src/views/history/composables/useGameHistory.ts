import { onMounted, ref } from 'vue'
import {
  deleteSession as deleteSessionRow,
  loadHistory,
  syncPeople,
  upsertAllSessions,
  upsertSession,
} from '../api/historyDb'
import { insertOperationLogs } from '../api/historyOpLog'
import {
  formatStorageDateTime,
  getSessionParticipants,
  nextPersonId,
  nextSessionRowId,
  renumberRounds,
  renumberSessions,
  sortSessionsNewestFirst,
  sessionTotals,
  scoreForRound,
  snapshotParticipants,
} from '../utils/historyState'
import type { GameHistoryState, PendingOperationLog, Person, Round, Session } from '../types'

const SYNC_DEBOUNCE_MS = 600

type SyncTask =
  | { type: 'people' }
  | { type: 'session'; id: number }
  | { type: 'sessions-all' }
  | { type: 'delete-session'; id: number }

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export { getSessionParticipants, sessionTotals, scoreForRound } from '../utils/historyState'

export function useGameHistory() {
  const people = ref<Person[]>([])
  const sessions = ref<Session[]>([])
  const syncStatus = ref<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')

  let isHydrating = false
  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let syncQueue: SyncTask[] = []
  let pendingLogs: PendingOperationLog[] = []

  function applyState(state: GameHistoryState) {
    people.value = state.people
    sessions.value = sortSessionsNewestFirst(state.sessions)
  }

  function recordLog(entry: PendingOperationLog) {
    pendingLogs.push(entry)
  }

  function enqueue(task: SyncTask) {
    if (isHydrating) return
    syncQueue.push(task)
    scheduleSync()
  }

  async function flushSync() {
    const queue = syncQueue
    syncQueue = []
    if (!queue.length) return

    syncStatus.value = 'saving'
    const batchLogs = pendingLogs.splice(0, pendingLogs.length)
    try {
      const deleteIds = [
        ...new Set(
          queue
            .filter((t): t is { type: 'delete-session'; id: number } => t.type === 'delete-session')
            .map((t) => t.id),
        ),
      ]
      const sessionIds = [
        ...new Set(
          queue.filter((t): t is { type: 'session'; id: number } => t.type === 'session').map((t) => t.id),
        ),
      ]
      const needPeople = queue.some((t) => t.type === 'people')
      const needAllSessions = queue.some((t) => t.type === 'sessions-all')

      for (const id of deleteIds) {
        await deleteSessionRow(id)
      }
      if (needAllSessions) {
        await upsertAllSessions(sessions.value)
      } else {
        for (const id of sessionIds) {
          const session = sessions.value.find((s) => s.id === id)
          if (session) await upsertSession(session)
        }
      }
      if (needPeople) {
        await syncPeople(people.value)
      }
      if (batchLogs.length) {
        await insertOperationLogs(batchLogs)
      }
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
      void flushSync()
    }, SYNC_DEBOUNCE_MS)
  }

  async function loadFromRemote() {
    syncStatus.value = 'loading'
    isHydrating = true
    syncQueue = []
    pendingLogs = []
    try {
      applyState(await loadHistory())
      syncStatus.value = 'saved'
    } catch (error) {
      console.error('输赢记录拉取失败:', error)
      syncStatus.value = 'error'
    } finally {
      isHydrating = false
    }
  }

  onMounted(() => {
    void loadFromRemote()
  })

  function addPerson(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return false
    if (people.value.some((p) => p.name === trimmed)) return false
    const before = clone(people.value)
    const newPerson = { id: nextPersonId(people.value), name: trimmed }
    people.value.push(newPerson)
    recordLog({
      operation: 'add_person',
      target_type: 'people',
      target_id: String(newPerson.id),
      before_data: before,
      after_data: clone(people.value),
    })
    enqueue({ type: 'people' })
    return true
  }

  function removePerson(personId: number) {
    const person = people.value.find((p) => p.id === personId)
    if (!person) return
    const before = clone(people.value)
    people.value = people.value.filter((p) => p.id !== personId)
    recordLog({
      operation: 'remove_person',
      target_type: 'people',
      target_id: String(personId),
      before_data: { people: before, person },
      after_data: clone(people.value),
    })
    enqueue({ type: 'people' })
  }

  function addSession() {
    const rowId = nextSessionRowId(sessions.value)
    const session: Session = {
      id: rowId,
      sessionNo: sessions.value.length + 1,
      time: formatStorageDateTime(),
      participants: snapshotParticipants(people.value),
      rounds: [],
    }
    sessions.value.unshift(session)
    renumberSessions(sessions.value)
    recordLog({
      operation: 'add_session',
      target_type: 'session',
      target_id: String(rowId),
      before_data: null,
      after_data: clone(session),
    })
    enqueue({ type: 'sessions-all' })
    return sessions.value[0]?.id
  }

  function removeSession(sessionId: number) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    const before = clone(session)
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)
    renumberSessions(sessions.value)
    recordLog({
      operation: 'delete_session',
      target_type: 'session',
      target_id: String(sessionId),
      before_data: before,
      after_data: null,
    })
    enqueue({ type: 'delete-session', id: sessionId })
    enqueue({ type: 'sessions-all' })
  }

  function addRound(sessionId: number, patch: Pick<Round, 'roundNo' | 'time' | 'amounts'>) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    const round: Round = {
      id: patch.roundNo,
      roundNo: patch.roundNo,
      time: patch.time,
      amounts: { ...patch.amounts },
    }
    session.rounds.push(round)
    renumberRounds(session)
    const saved = session.rounds.find((r) => r.roundNo === patch.roundNo) ?? round
    recordLog({
      operation: 'add_round',
      target_type: 'round',
      target_id: String(saved.id),
      before_data: { sessionId, round: null },
      after_data: { sessionId, round: clone(saved) },
    })
    enqueue({ type: 'session', id: sessionId })
  }

  function updateRound(
    sessionId: number,
    roundId: number,
    patch: Partial<Pick<Round, 'roundNo' | 'time' | 'amounts'>>,
  ) {
    const session = sessions.value.find((s) => s.id === sessionId)
    const round = session?.rounds.find((r) => r.id === roundId)
    if (!round) return
    const before = clone({ sessionId, round })
    Object.assign(round, patch)
    if (patch.amounts) round.amounts = { ...patch.amounts }
    if (patch.roundNo !== undefined) renumberRounds(session!)
    const afterRound = session!.rounds.find((r) => r.id === roundId) ?? round
    recordLog({
      operation: 'update_round',
      target_type: 'round',
      target_id: String(roundId),
      before_data: before,
      after_data: { sessionId, round: clone(afterRound) },
    })
    enqueue({ type: 'session', id: sessionId })
  }

  function removeRound(sessionId: number, roundId: number) {
    const session = sessions.value.find((s) => s.id === sessionId)
    const round = session?.rounds.find((r) => r.id === roundId)
    if (!session || !round) return
    const before = clone({ sessionId, round })
    session.rounds = session.rounds.filter((r) => r.id !== roundId)
    renumberRounds(session)
    recordLog({
      operation: 'remove_round',
      target_type: 'round',
      target_id: String(roundId),
      before_data: before,
      after_data: null,
    })
    enqueue({ type: 'session', id: sessionId })
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
