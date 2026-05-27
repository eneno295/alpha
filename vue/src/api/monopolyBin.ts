import { JSONBIN_CONFIG } from '@/api'
import { assertCanWrite, normalizeRoot } from '@/views/monopoly/monopolyState'
import type { MonopolyWriteAction } from '@/views/monopoly/monopolyState'
import type { MonopolyRoot, MonopolyRoom } from '@/views/monopoly/type'

/**
 * 大富翁专用 bin（与主业务、history 分离）
 */
export const MONOPOLY_BIN_ID = '6a16e37f8ef04f453821161f'

type BinResponse = { record?: unknown }

export async function fetchMonopolyRoot(): Promise<MonopolyRoot> {
  const url = `${JSONBIN_CONFIG.DATA_SOURCE}${MONOPOLY_BIN_ID}`
  const response = await fetch(url, {
    headers: { 'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY },
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const result = (await response.json()) as BinResponse
  return normalizeRoot(result.record)
}

export async function saveMonopolyRoot(root: MonopolyRoot): Promise<void> {
  const url = `${JSONBIN_CONFIG.DATA_SOURCE}${MONOPOLY_BIN_ID}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY,
    },
    body: JSON.stringify(root),
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
}

/**
 * 读-改-写单个房间
 * - assertCanWrite：对局中仅当前回合玩家可写
 * - version：与本地不一致时拒绝写入，避免覆盖他人操作
 */
export async function patchMonopolyRoom(
  roomCode: string,
  clientId: string,
  action: MonopolyWriteAction,
  mutator: (room: MonopolyRoom | undefined) => MonopolyRoom,
  expectedVersion?: number,
): Promise<MonopolyRoom> {
  const root = await fetchMonopolyRoot()
  const code = roomCode.trim().toUpperCase()
  const current = root.rooms[code]

  assertCanWrite(current, clientId, action)

  if (expectedVersion !== undefined && current && current.version !== expectedVersion) {
    throw new Error('房间状态已被其他人更新，请刷新后重试')
  }

  const next = mutator(current)
  root.rooms[code] = next
  await saveMonopolyRoot(root)
  return next
}
