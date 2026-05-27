export type Person = {
  id: string
  name: string
}

/** 场次创建时快照的参与人（与全局人员列表解耦） */
export type SessionParticipant = {
  personId: string
  name: string
}

export type Round = {
  id: string
  roundNo: number
  time: string
  /** 姓名 → 本局输赢（正赢负输） */
  amounts: Record<string, number>
}

export type Session = {
  id: string
  sessionNo: number
  time: string
  participants: SessionParticipant[]
  rounds: Round[]
}

export type GameHistoryState = {
  people: Person[]
  sessions: Session[]
}
