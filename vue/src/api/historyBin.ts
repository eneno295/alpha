import { normalizeState } from '@/views/history/historyState'
import type { GameHistoryState } from '@/views/history/type'
import { JSONBIN_CONFIG } from '@/api'

/** 输赢记录专用 bin，与主业务 bin 分离 */
export const HISTORY_BIN_ID = '6a16d42c8ef04f453820e226'

type HistoryBinResponse = {
  record?: unknown
}

export async function fetchHistoryFromAPI(): Promise<GameHistoryState> {
  const url = `${JSONBIN_CONFIG.DATA_SOURCE}${HISTORY_BIN_ID}`
  const response = await fetch(url, {
    headers: { 'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY },
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const result = (await response.json()) as HistoryBinResponse
  return normalizeState(result.record)
}

export async function updateHistoryInAPI(state: GameHistoryState): Promise<boolean> {
  const url = `${JSONBIN_CONFIG.DATA_SOURCE}${HISTORY_BIN_ID}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY,
    },
    body: JSON.stringify(state),
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return true
}
