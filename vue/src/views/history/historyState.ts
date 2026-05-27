import type { GameHistoryState, Person, Round, Session, SessionParticipant } from './type'

export function uid(): string {
  return crypto.randomUUID()
}

export function num(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export function normalizeState(state: unknown): GameHistoryState {
  const raw = (state ?? {}) as Partial<GameHistoryState>
  return {
    people: Array.isArray(raw.people) ? raw.people : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
  }
}

export function hasData(state: GameHistoryState): boolean {
  return state.people.length > 0 || state.sessions.length > 0
}

export function snapshotParticipants(people: Person[]): SessionParticipant[] {
  return people.map((p) => ({ personId: p.id, name: p.name }))
}

export function emptyAmounts(participants: SessionParticipant[]): Record<string, number> {
  return Object.fromEntries(participants.map((p) => [p.name, 0]))
}

export function getSessionParticipants(session: Session): SessionParticipant[] {
  return session.participants ?? []
}

export function renumberSessions(list: Session[]) {
  list.forEach((s, i) => {
    s.sessionNo = i + 1
  })
}

export function renumberRounds(session: Session) {
  session.rounds.forEach((r, i) => {
    r.roundNo = i + 1
  })
}

export function scoreForRound(round: Round, name: string): number {
  return num(round.amounts[name])
}

export function sessionTotals(session: Session): Record<string, number> {
  const totals: Record<string, number> = {}
  getSessionParticipants(session).forEach((p) => {
    totals[p.name] = 0
  })
  session.rounds.forEach((round) => {
    Object.entries(round.amounts).forEach(([name, amount]) => {
      totals[name] = (totals[name] ?? 0) + num(amount)
    })
  })
  return totals
}
