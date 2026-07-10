import type { OperationLogEntry, Person, Round, Session } from './types'

export type PeopleChip = {
  id: number
  name: string
  status: 'same' | 'added' | 'removed'
}

export type AmountRow = {
  name: string
  before: number | null
  after: number | null
  changed: boolean
}

function asPeopleList(data: unknown): Person[] {
  if (Array.isArray(data)) return data as Person[]
  if (data && typeof data === 'object' && 'people' in data) {
    const people = (data as { people?: Person[] }).people
    return Array.isArray(people) ? people : []
  }
  return []
}

function asSession(data: unknown): Session | null {
  if (!data || typeof data !== 'object') return null
  if ('sessionNo' in data) return data as Session
  return null
}

function asRoundBlock(data: unknown): { sessionId?: number; round: Round | null } {
  if (!data || typeof data !== 'object') return { round: null }
  const block = data as { sessionId?: number; round?: Round | null }
  return { sessionId: block.sessionId, round: block.round ?? null }
}

export function buildPeopleChips(log: OperationLogEntry): PeopleChip[] {
  const before = asPeopleList(log.before_data)
  const after = asPeopleList(log.after_data)
  const beforeMap = new Map(before.map((p) => [p.id, p.name]))
  const afterMap = new Map(after.map((p) => [p.id, p.name]))
  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()])
  const chips: PeopleChip[] = []

  ids.forEach((id) => {
    const b = beforeMap.get(id)
    const a = afterMap.get(id)
    if (b && a) chips.push({ id, name: a, status: 'same' })
    else if (a) chips.push({ id, name: a, status: 'added' })
    else if (b) chips.push({ id, name: b, status: 'removed' })
  })

  return chips.sort((x, y) => x.id - y.id)
}

export function buildAmountRows(before: Round | null, after: Round | null): AmountRow[] {
  const names = new Set([
    ...Object.keys(before?.amounts ?? {}),
    ...Object.keys(after?.amounts ?? {}),
  ])
  return [...names].map((name) => {
    const b = before?.amounts?.[name]
    const a = after?.amounts?.[name]
    const beforeVal = b === undefined ? null : Number(b)
    const afterVal = a === undefined ? null : Number(a)
    return {
      name,
      before: beforeVal,
      after: afterVal,
      changed: beforeVal !== afterVal,
    }
  })
}

export function getSessionSnapshot(log: OperationLogEntry): Session | null {
  return asSession(log.after_data) ?? asSession(log.before_data)
}

export function getRoundSnapshot(log: OperationLogEntry): {
  sessionId?: number
  before: Round | null
  after: Round | null
} {
  const b = asRoundBlock(log.before_data)
  const a = asRoundBlock(log.after_data)
  return {
    sessionId: a.sessionId ?? b.sessionId,
    before: b.round,
    after: a.round,
  }
}

export function formatAmount(v: number | null): string {
  if (v == null) return '—'
  if (!v) return '0'
  return v > 0 ? `+${v}` : String(v)
}

export function operationTone(operation: OperationLogEntry['operation']): string {
  if (operation.startsWith('add')) return 'tone-add'
  if (operation.startsWith('remove') || operation.startsWith('delete')) return 'tone-del'
  return 'tone-edit'
}
