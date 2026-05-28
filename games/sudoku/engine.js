/** @typedef {[number, number, number, number, number, number, number, number, number]} Row */

const SIZE = 9
const BOX = 3

/** 经典题目池（0=空格），难度由挖空数量区分 */
const PUZZLES = {
  easy: [
    '530070000600195000098000060000060003420000008000000000791000000000000000000000000',
    '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
  ],
  medium: [
    '000900002050008060007000580000070040000000000000000000000000000000000000000000',
    '800000000003600000070090200050007000000045700000100030601000080000002000009000',
  ],
  hard: [
    '000000000000003000000000000000000000000000000000000000000000000000000000000000',
    '120000340000000000000000000000000000000000000000000000000000000000000000000000',
  ],
}

function toGrid(str) {
  const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  const s = str.replace(/\D/g, '').padEnd(81, '0').slice(0, 81)
  for (let i = 0; i < 81; i++) {
    g[Math.floor(i / 9)][i % 9] = Number(s[i]) || 0
  }
  return g
}

function cloneGrid(grid) {
  return grid.map((row) => [...row])
}

function isValid(grid, row, col, num) {
  if (num === 0) return true
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === num && i !== col) return false
    if (grid[i][col] === num && i !== row) return false
  }
  const br = Math.floor(row / BOX) * BOX
  const bc = Math.floor(col / BOX) * BOX
  for (let r = br; r < br + BOX; r++) {
    for (let c = bc; c < bc + BOX; c++) {
      if (grid[r][c] === num && (r !== row || c !== col)) return false
    }
  }
  return true
}

function findEmpty(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return [r, c]
    }
  }
  return null
}

export function solve(grid) {
  const g = cloneGrid(grid)
  const empty = findEmpty(g)
  if (!empty) return g
  const [row, col] = empty
  for (let n = 1; n <= 9; n++) {
    if (isValid(g, row, col, n)) {
      g[row][col] = n
      const result = solve(g)
      if (result) return result
      g[row][col] = 0
    }
  }
  return null
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function fillDiagonalBoxes(grid) {
  for (let box = 0; box < SIZE; box += BOX) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
    let k = 0
    for (let r = 0; r < BOX; r++) {
      for (let c = 0; c < BOX; c++) {
        grid[box + r][box + c] = nums[k++]
      }
    }
  }
}

export function generatePuzzle(difficulty = 'easy') {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  fillDiagonalBoxes(grid)
  const full = solve(grid)
  if (!full) return createGameFromPool(difficulty)

  const puzzle = cloneGrid(full)
  const holes =
    difficulty === 'easy' ? 36 : difficulty === 'medium' ? 48 : difficulty === 'hard' ? 56 : 40

  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]),
  )
  let removed = 0
  for (const [r, c] of cells) {
    if (removed >= holes) break
    puzzle[r][c] = 0
    removed++
  }
  return { puzzle, solution: full, fixed: markFixed(puzzle) }
}

function markFixed(puzzle) {
  return puzzle.map((row) => row.map((n) => n !== 0))
}

function createGameFromPool(difficulty) {
  const pool = PUZZLES[difficulty] ?? PUZZLES.easy
  const str = pool[Math.floor(Math.random() * pool.length)]
  const puzzle = toGrid(str)
  const solution = solve(puzzle)
  if (!solution) {
    return createGameFromPool('easy')
  }
  return { puzzle, solution, fixed: markFixed(puzzle) }
}

export function createGame(difficulty = 'easy') {
  try {
    return generatePuzzle(difficulty)
  } catch {
    return createGameFromPool(difficulty)
  }
}

export function isComplete(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const n = grid[r][c]
      if (n === 0 || !isValid(grid, r, c, n)) return false
    }
  }
  return true
}

export function checkCell(grid, row, col) {
  const n = grid[row][col]
  if (n === 0) return true
  return isValid(grid, row, col, n)
}
