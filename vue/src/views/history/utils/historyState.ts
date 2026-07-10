import type { Person, Round, Session, SessionParticipant } from '../types'

export function nextPersonId(people: Person[]): number {
  return people.reduce((max, p) => Math.max(max, p.id), 0) + 1
}

export function nextSessionRowId(sessions: Session[]): number {
  return sessions.reduce((max, s) => Math.max(max, s.id), 0) + 1
}

/** 存库格式：2026-06-13 10:04:14 */
export function formatStorageDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function parseStoredDateTime(value: string): Date {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  if (!m) return new Date(NaN)
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
}

export function formatDisplayDateTime(value: string, withYear = true): string {
  const d = parseStoredDateTime(value)
  if (!Number.isFinite(d.getTime())) return '-'
  if (withYear) {
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** 按 sessionNo 新→旧排序 */
export function sortSessionsNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.sessionNo - a.sessionNo)
}

export function num(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export function snapshotParticipants(people: Person[]): SessionParticipant[] {
  return people.map((p) => ({ personId: p.id, name: p.name }))
}

export function getSessionParticipants(session: Session): SessionParticipant[] {
  return session.participants ?? []
}

/** 数组按时间新→旧排列时：最新一场编号最大，最早一场为 1 */
export function renumberSessions(list: Session[]) {
  const n = list.length
  list.forEach((s, i) => {
    s.sessionNo = n - i
  })
}

export function renumberRounds(session: Session) {
  session.rounds.forEach((r, i) => {
    const no = i + 1
    r.roundNo = no
    r.id = no
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
