/** 单房间状态（存入 JSONBin 的 rooms[roomCode]） */
export type MonopolyPlayer = {
  clientId: string
  name: string
  color: string
  position: number
  money: number
}

export type MonopolyRoom = {
  version: number
  phase: 'lobby' | 'playing' | 'ended'
  hostClientId: string
  currentPlayerIndex: number
  lastDice: [number, number] | null
  /** 最近一步移动（用于各端播放跳跃动画） */
  lastMove: {
    clientId: string
    from: number
    steps: number
    at: string
  } | null
  players: (MonopolyPlayer | null)[]
  updatedAt: string
}

export type MonopolyRoot = {
  rooms: Record<string, MonopolyRoom>
}

export const MAX_PLAYERS = 4
export const BOARD_SIZE = 40

export const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'] as const
