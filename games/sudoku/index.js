#!/usr/bin/env node
import process from 'node:process'
import readline from 'node:readline'
import { createGame, isComplete, checkCell } from './engine.js'

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bgSel: '\x1b[48;5;24m',
  bgFixed: '\x1b[2m',
}

function parseArgs() {
  const arg = process.argv[2]?.toLowerCase()
  if (['easy', 'e', '简单'].includes(arg)) return 'easy'
  if (['medium', 'm', '中等'].includes(arg)) return 'medium'
  if (['hard', 'h', '困难'].includes(arg)) return 'hard'
  return 'easy'
}

function render(game, cursor, message = '', err = false) {
  const { puzzle: grid, fixed } = game
  const lines = []
  lines.push('')
  lines.push(`${C.bold}${C.cyan}  终端数独${C.reset}  ${C.dim}↑↓←→移动 · 1-9填数 · 0/退格清除 · n新局 · h提示 · q退出${C.reset}`)
  if (message) {
    lines.push(err ? `${C.red}  ${message}${C.reset}` : `${C.green}  ${message}${C.reset}`)
  }
  lines.push('')

  for (let r = 0; r < 9; r++) {
    if (r % 3 === 0 && r > 0) lines.push('  ├───────┼───────┼───────┤')
    let row = r % 3 === 0 ? '  ┌' : '  │'
    for (let c = 0; c < 9; c++) {
      if (c % 3 === 0 && c > 0) row += '│'
      const sel = r === cursor.r && c === cursor.c
      const n = grid[r][c]
      const ch = n === 0 ? '·' : String(n)
      const conflict = n !== 0 && !checkCell(grid, r, c)

      let cell = ` ${ch} `
      if (sel) cell = `${C.bgSel}${cell}${C.reset}`
      else if (fixed[r][c]) cell = `${C.dim}${C.bold}${cell}${C.reset}`
      else if (conflict) cell = `${C.red}${cell}${C.reset}`
      else if (n !== 0) cell = `${C.yellow}${cell}${C.reset}`

      row += cell
      if (c === 8) row += '│'
    }
    lines.push(row + (r === 8 ? '\n  └───────┴───────┴───────┘' : ''))
  }
  lines.push('')
  return lines.join('\n')
}

function clear() {
  process.stdout.write('\x1b[2J\x1b[H')
}

function main() {
  const difficulty = parseArgs()
  let game = createGame(difficulty)
  let cursor = { r: 0, c: 0 }
  let status = `新局（${difficulty}）`

  if (!process.stdin.isTTY) {
    console.log('请在终端中运行：node index.js')
    process.exit(1)
  }

  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()

  const draw = (msg = status, err = false) => {
    clear()
    process.stdout.write(render(game, cursor, msg, err))
  }

  const moveCursor = (dr, dc) => {
    cursor.r = (cursor.r + dr + 9) % 9
    cursor.c = (cursor.c + dc + 9) % 9
    draw()
  }

  const setCell = (num) => {
    const { r, c } = cursor
    if (game.fixed[r][c]) {
      draw('这是题目给的数字，不能改', true)
      return
    }
    game.puzzle[r][c] = num
    if (num !== 0 && !checkCell(game.puzzle, r, c)) {
      draw('这里和同行/列/宫冲突了', true)
      return
    }
    if (isComplete(game.puzzle)) {
      draw('恭喜，完成了！按 n 再来一局', false)
      return
    }
    draw()
  }

  const hint = () => {
    const { r, c } = cursor
    if (game.fixed[r][c]) {
      draw('请把光标移到空格再提示', true)
      return
    }
    const ans = game.solution[r][c]
    game.puzzle[r][c] = ans
    draw(`提示：第 ${r + 1} 行第 ${c + 1} 列是 ${ans}`)
  }

  const newGame = () => {
    game = createGame(difficulty)
    cursor = { r: 0, c: 0 }
    status = `新局（${difficulty}）`
    draw(status)
  }

  draw(status)

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.stdin.setRawMode(false)
      process.exit(0)
    }

    if (key.name === 'q' || (key.ctrl && key.name === 'd')) {
      clear()
      process.stdin.setRawMode(false)
      console.log('再见～')
      process.exit(0)
    }

    if (key.name === 'up') return moveCursor(-1, 0)
    if (key.name === 'down') return moveCursor(1, 0)
    if (key.name === 'left') return moveCursor(0, -1)
    if (key.name === 'right') return moveCursor(0, 1)
    if (key.name === 'n') return newGame()
    if (key.name === 'h') return hint()

    if (key.name === 'backspace' || str === '0') return setCell(0)

    const n = Number(str)
    if (n >= 1 && n <= 9) return setCell(n)
  })
}

main()
