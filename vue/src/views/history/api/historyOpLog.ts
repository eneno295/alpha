import { formatStorageDateTime } from '../utils/historyState'
import { OPERATION_LOG_TABLE, supabase } from './supabase'
import type { OperationLogEntry, OperationType, PendingOperationLog } from '../types'

export const OPERATION_LABELS: Record<OperationType, string> = {
  add_person: '添加人员',
  remove_person: '删除人员',
  add_session: '新建场次',
  delete_session: '删除场次',
  add_round: '加一局',
  update_round: '修改一局',
  remove_round: '删除一局',
  settle_session: '结清场次',
}

export const TARGET_TYPE_LABELS: Record<string, string> = {
  people: '人员',
  session: '场次',
  round: '局',
}

let cachedIp: string | null = null

/** 获取操作人公网 IP（缓存，失败返回 unknown） */
export async function getClientIp(): Promise<string> {
  if (cachedIp) return cachedIp
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { ip?: string }
    cachedIp = data.ip?.trim() || 'unknown'
  } catch {
    cachedIp = 'unknown'
  }
  return cachedIp
}

type InsertRow = PendingOperationLog & {
  ip: string
  created_at: string
}

export async function insertOperationLogs(entries: PendingOperationLog[]): Promise<void> {
  if (!entries.length) return
  const ip = await getClientIp()
  const created_at = formatStorageDateTime()
  const rows: InsertRow[] = entries.map((e) => ({
    ...e,
    ip,
    created_at,
  }))
  const { error } = await supabase.from(OPERATION_LOG_TABLE).insert(rows)
  if (error) throw error
}

export async function loadOperationLogs(): Promise<OperationLogEntry[]> {
  const { data, error } = await supabase
    .from(OPERATION_LOG_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  return (data ?? []) as OperationLogEntry[]
}

export function formatLogJson(data: unknown): string {
  if (data == null) return '—'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
