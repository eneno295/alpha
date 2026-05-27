import { BOARD_SIZE } from './type'

/** 经典大富翁：40 格矩形环（底 11 + 左 10 + 顶 10 + 右 9） */
const CELL = 2.4
const HALF = 5 * CELL

export type BoardPoint = { x: number; z: number; y: number }

function bottomEdge(i: number): BoardPoint {
  const t = i / 10
  return { x: HALF * (1 - 2 * t), z: HALF, y: 0 }
}

function leftEdge(i: number): BoardPoint {
  const t = i / 10
  return { x: -HALF, z: HALF * (1 - 2 * t), y: 0 }
}

function topEdge(i: number): BoardPoint {
  const t = i / 10
  return { x: -HALF + 2 * HALF * t, z: -HALF, y: 0 }
}

function rightEdge(i: number): BoardPoint {
  const t = i / 9
  return { x: HALF, z: -HALF + 2 * HALF * t, y: 0 }
}

export function getCellPosition(index: number): BoardPoint {
  const i = ((index % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE
  if (i <= 10) return bottomEdge(i)
  if (i <= 20) return leftEdge(i - 11)
  if (i <= 30) return topEdge(i - 21)
  return rightEdge(i - 31)
}

/** 格子显示名（简化版经典地标） */
export const CELL_LABELS: string[] = [
  'GO',
  '北京',
  '社区',
  '上海',
  '税',
  '南站',
  '深圳',
  '机会',
  '广州',
  '西安',
  '监狱',
  '杭州',
  '电力',
  '成都',
  '重庆',
  '北站',
  '武汉',
  '社区',
  '南京',
  '基金',
  '免费',
  '苏州',
  '机会',
  '天津',
  '水厂',
  '青岛',
  '大连',
  '东站',
  '厦门',
  '长沙',
  '入狱',
  '郑州',
  '社区',
  '合肥',
  '机场',
  '福州',
  '机会',
  '南昌',
  '税',
  '香港',
]

export function cellColor(index: number): number {
  const corner = [0, 10, 20, 30].includes(index)
  if (corner) return 0xf5f5f4
  const group = Math.floor((index % 10) / 3)
  const palette = [0x93c5fd, 0xf9a8d4, 0x86efac, 0xfde047]
  return palette[group % palette.length] ?? 0xd4d4d8
}

export { CELL, HALF }
