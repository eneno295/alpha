export type Person = {
  id: number
  name: string
}

/** 场次创建时快照的参与人（与全局人员列表解耦） */
export type SessionParticipant = {
  personId: number
  name: string
}

export type Round = {
  id: number
  roundNo: number
  time: string
  /** 姓名 → 本局输赢（正赢负输） */
  amounts: Record<string, number>
}

export type Session = {
  /** 表行 id：从 1 递增，删除后不回收 */
  id: number
  sessionNo: number
  /** 场次创建时间，存库列名 created_at */
  time: string
  settled: boolean
  /** 结清时间，存库列名 settled_at */
  settledAt: string | null
  participants: SessionParticipant[]
  rounds: Round[]
}

export type GameHistoryState = {
  people: Person[]
  sessions: Session[]
}

export type OperationType =
  | 'add_person'
  | 'remove_person'
  | 'add_session'
  | 'delete_session'
  | 'add_round'
  | 'update_round'
  | 'remove_round'
  | 'settle_session'

/** 操作日志全部 7 种类型（与数据库 check 约束一致） */
export const OPERATION_TYPES: OperationType[] = [
  'add_person',
  'remove_person',
  'add_session',
  'delete_session',
  'add_round',
  'update_round',
  'remove_round',
  'settle_session',
]

export type TargetType = 'people' | 'session' | 'round'

/** 待写入库的操作日志（同步成功后落库） */
export type PendingOperationLog = {
  operation: OperationType
  target_type: TargetType
  target_id: string | null
  before_data: unknown
  after_data: unknown
}

export type OperationLogEntry = PendingOperationLog & {
  id: number
  ip: string | null
  created_at: string
}
