import { formatStorageDateTime, sortSessionsNewestFirst } from '../utils/historyState'
import { HISTORY_TABLE, PEOPLE_ROW_ID, supabase } from './supabase'
import type { GameHistoryState, Person, Round, Session, SessionParticipant } from '../types'

type HistoryRow = {
  id: number
  kind: 'people_list' | 'session'
  session_no: number | null
  created_at: string | null
  updated_at: string | null
  settled: boolean | null
  settled_at: string | null
  participants: SessionParticipant[] | null
  rounds: Round[] | null
  people: Person[] | null
}

function rowToSession(row: HistoryRow): Session {
  return {
    id: row.id,
    sessionNo: row.session_no ?? 0,
    time: row.created_at ?? '',
    settled: row.settled ?? false,
    settledAt: row.settled_at ?? null,
    participants: row.participants ?? [],
    rounds: row.rounds ?? [],
  }
}

function sessionToRow(session: Session) {
  const now = formatStorageDateTime()
  return {
    id: session.id,
    kind: 'session' as const,
    session_no: session.sessionNo,
    created_at: session.time,
    updated_at: now,
    settled: session.settled,
    settled_at: session.settledAt,
    participants: session.participants,
    rounds: session.rounds,
  }
}

/** 加载全部：id=0 人员，id>=1 场次 */
export async function loadHistory(): Promise<GameHistoryState> {
  const { data, error } = await supabase.from(HISTORY_TABLE).select('*')
  if (error) throw error

  const rows = (data ?? []) as HistoryRow[]
  const peopleRow = rows.find((row) => row.id === PEOPLE_ROW_ID)

  return {
    people: peopleRow?.people ?? [],
    sessions: sortSessionsNewestFirst(
      rows.filter((row) => row.kind === 'session').map(rowToSession),
    ),
  }
}

export async function syncPeople(people: Person[]): Promise<void> {
  const { error } = await supabase.from(HISTORY_TABLE).upsert({
    id: PEOPLE_ROW_ID,
    kind: 'people_list',
    people,
    updated_at: formatStorageDateTime(),
  })
  if (error) throw error
}

export async function upsertSession(session: Session): Promise<void> {
  const { error } = await supabase.from(HISTORY_TABLE).upsert(sessionToRow(session))
  if (error) throw error
}

export async function upsertAllSessions(sessions: Session[]): Promise<void> {
  if (!sessions.length) return
  const { error } = await supabase.from(HISTORY_TABLE).upsert(sessions.map(sessionToRow))
  if (error) throw error
}

export async function deleteSession(sessionId: number): Promise<void> {
  const { error } = await supabase
    .from(HISTORY_TABLE)
    .delete()
    .eq('id', sessionId)
    .eq('kind', 'session')
  if (error) throw error
}
