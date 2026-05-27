import { BOARD_SIZE, MAX_PLAYERS, PLAYER_COLORS, type MonopolyPlayer, type MonopolyRoom, type MonopolyRoot } from './type'

const CLIENT_KEY = 'monopoly-client-id'

export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(CLIENT_KEY, id)
  }
  return id
}

export function normalizeRoot(raw: unknown): MonopolyRoot {
  const data = (raw ?? {}) as Partial<MonopolyRoot>
  const rooms = data.rooms && typeof data.rooms === 'object' ? data.rooms : {}
  return { rooms: { ...rooms } }
}

export function createRoom(hostClientId: string): MonopolyRoom {
  const now = new Date().toISOString()
  return {
    version: 1,
    phase: 'lobby',
    hostClientId,
    currentPlayerIndex: 0,
    lastDice: null,
    lastMove: null,
    players: Array.from({ length: MAX_PLAYERS }, () => null),
    updatedAt: now,
  }
}

export function findPlayerIndex(room: MonopolyRoom, clientId: string): number {
  return room.players.findIndex((p) => p?.clientId === clientId)
}

export function activePlayerCount(room: MonopolyRoom): number {
  return room.players.filter(Boolean).length
}

export function isMyTurn(room: MonopolyRoom, clientId: string): boolean {
  const idx = findPlayerIndex(room, clientId)
  if (idx < 0) return false
  return room.phase === 'playing' && room.currentPlayerIndex === idx
}

/** 允许写入 JSONBin 的操作类型 */
export type MonopolyWriteAction = 'join' | 'start' | 'roll'

/**
 * 写入权限（防 A/B 同时 PUT 互相覆盖）：
 * - 大厅：可加入 / 房主开始
 * - 对局中：仅当前回合玩家可 roll，其余人只读轮询
 */
export function assertCanWrite(
  room: MonopolyRoom | undefined,
  clientId: string,
  action: MonopolyWriteAction,
): void {
  if (action === 'join') {
    if (!room) return
    if (room.phase !== 'lobby') {
      throw new Error('游戏已开始，无法加入')
    }
    return
  }

  if (!room) throw new Error('房间不存在')

  if (room.phase === 'ended') {
    throw new Error('本局已结束')
  }

  if (action === 'start') {
    if (room.phase !== 'lobby') throw new Error('游戏已开始')
    if (room.hostClientId !== clientId) throw new Error('仅房主可开始')
    return
  }

  if (action === 'roll') {
    if (room.phase !== 'playing') throw new Error('游戏尚未开始')
    if (!isMyTurn(room, clientId)) {
      throw new Error('还没轮到你，请等待同步（其他玩家只能观战）')
    }
  }
}

/** 已在房间内、对局中且非自己回合 → 只读 */
export function isReadOnlyClient(room: MonopolyRoom, clientId: string): boolean {
  if (room.phase !== 'playing') return false
  return findPlayerIndex(room, clientId) >= 0 && !isMyTurn(room, clientId)
}

export function nextPlayerIndex(room: MonopolyRoom): number {
  const order = room.players
    .map((p, i) => (p ? i : -1))
    .filter((i) => i >= 0)
  if (!order.length) return 0
  const cur = order.indexOf(room.currentPlayerIndex)
  const next = order[(cur + 1) % order.length]
  return next ?? order[0]
}

export function rollDice(): [number, number] {
  const a = 1 + Math.floor(Math.random() * 6)
  const b = 1 + Math.floor(Math.random() * 6)
  return [a, b]
}

export function advancePosition(pos: number, steps: number): number {
  return (pos + steps) % BOARD_SIZE
}

export function joinPlayerSlot(room: MonopolyRoom, clientId: string, name: string): MonopolyRoom {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('请输入昵称')
  if (room.phase !== 'lobby') throw new Error('游戏已开始，无法加入')

  const existing = findPlayerIndex(room, clientId)
  if (existing >= 0) {
    const p = room.players[existing]!
    p.name = trimmed
    room.updatedAt = new Date().toISOString()
    room.version += 1
    return room
  }

  const empty = room.players.findIndex((p) => !p)
  if (empty < 0) throw new Error('房间已满（最多 4 人）')

  room.players[empty] = {
    clientId,
    name: trimmed,
    color: PLAYER_COLORS[empty],
    position: 0,
    money: 1500,
  }
  room.updatedAt = new Date().toISOString()
  room.version += 1
  return room
}

export function startGame(room: MonopolyRoom, clientId: string): MonopolyRoom {
  if (room.hostClientId !== clientId) throw new Error('仅房主可开始')
  if (activePlayerCount(room) < 2) throw new Error('至少 2 人才能开始')
  room.phase = 'playing'
  room.currentPlayerIndex = room.players.findIndex(Boolean)
  room.lastDice = null
  room.lastMove = null
  room.players.forEach((p) => {
    if (p) {
      p.position = 0
      p.money = 1500
    }
  })
  room.updatedAt = new Date().toISOString()
  room.version += 1
  return room
}

export function applyRoll(room: MonopolyRoom, clientId: string): MonopolyRoom {
  if (!isMyTurn(room, clientId)) throw new Error('还没轮到你')
  const idx = findPlayerIndex(room, clientId)
  const player = room.players[idx]!
  const dice = rollDice()
  const steps = dice[0] + dice[1]
  const from = player.position
  player.position = advancePosition(from, steps)
  room.lastDice = dice
  room.lastMove = {
    clientId,
    from,
    steps,
    at: new Date().toISOString(),
  }
  room.currentPlayerIndex = nextPlayerIndex(room)
  room.updatedAt = new Date().toISOString()
  room.version += 1
  return room
}
