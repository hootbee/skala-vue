const SIZE = 15
const EMPTY = 0
const BLACK = 1
const WHITE = 2
const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]]
const CENTER = Math.floor(SIZE / 2)

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
const inside = (row, col) => row >= 0 && row < SIZE && col >= 0 && col < SIZE
const cloneBoard = (board) => board.map((line) => [...line])
const put = (board, row, col, stone) => { board[row][col] = stone }

const countDirection = (board, row, col, rowStep, colStep, stone) => {
  let count = 0
  let nextRow = row + rowStep
  let nextCol = col + colStep
  while (inside(nextRow, nextCol) && board[nextRow][nextCol] === stone) {
    count += 1
    nextRow += rowStep
    nextCol += colStep
  }
  return count
}

export const hasFive = (board, row, col, stone) => DIRECTIONS.some(([rowStep, colStep]) => (
  1 + countDirection(board, row, col, rowStep, colStep, stone)
    + countDirection(board, row, col, -rowStep, -colStep, stone) >= 5
))

const openEnds = (board, row, col, rowStep, colStep, stone) => {
  const forward = countDirection(board, row, col, rowStep, colStep, stone)
  const backward = countDirection(board, row, col, -rowStep, -colStep, stone)
  const forwardRow = row + (forward + 1) * rowStep
  const forwardCol = col + (forward + 1) * colStep
  const backwardRow = row - (backward + 1) * rowStep
  const backwardCol = col - (backward + 1) * colStep
  return Number(inside(forwardRow, forwardCol) && board[forwardRow][forwardCol] === EMPTY)
    + Number(inside(backwardRow, backwardCol) && board[backwardRow][backwardCol] === EMPTY)
}

const linePatternScore = (board, row, col, rowStep, colStep, stone) => {
  const opponent = stone === BLACK ? WHITE : BLACK
  let pattern = ''
  for (let offset = -5; offset <= 5; offset += 1) {
    const nextRow = row + offset * rowStep
    const nextCol = col + offset * colStep
    if (!inside(nextRow, nextCol)) pattern += '#'
    else if (board[nextRow][nextCol] === stone) pattern += 'X'
    else if (board[nextRow][nextCol] === opponent) pattern += 'O'
    else pattern += '.'
  }
  const patterns = [
    ['.XXXX.', 50000], ['XXXX.', 9000], ['.XXXX', 9000],
    ['.XXX.', 4200], ['.XX.X.', 3200], ['.X.XX.', 3200],
    ['.XX..X.', 650], ['.X..XX.', 650], ['.XX.', 180],
  ]
  return patterns.reduce((score, [shape, value]) => score + (pattern.includes(shape) ? value : 0), 0)
}

const moveScore = (board, row, col, stone) => {
  if (!inside(row, col) || board[row][col] !== EMPTY) return -Infinity
  put(board, row, col, stone)
  let score = 0
  DIRECTIONS.forEach(([rowStep, colStep]) => {
    const length = 1 + countDirection(board, row, col, rowStep, colStep, stone)
      + countDirection(board, row, col, -rowStep, -colStep, stone)
    const ends = openEnds(board, row, col, rowStep, colStep, stone)
    if (length >= 5) score += 1000000
    else if (length === 4 && ends === 2) score += 30000
    else if (length === 4) score += 8000
    else if (length === 3 && ends === 2) score += 5000
    else if (length === 3) score += 500
    else if (length === 2 && ends === 2) score += 220
    score += linePatternScore(board, row, col, rowStep, colStep, stone)
  })
  put(board, row, col, EMPTY)
  return score
}

const occupiedCells = (board) => {
  const cells = []
  board.forEach((line, row) => line.forEach((stone, col) => {
    if (stone !== EMPTY) cells.push([row, col])
  }))
  return cells
}

const candidateMoves = (board, lastMove) => {
  const occupied = occupiedCells(board)
  if (!occupied.length) return [[CENTER, CENTER]]
  const cells = new Set()
  const addAround = (row, col, radius) => {
    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (let colOffset = -radius; colOffset <= radius; colOffset += 1) {
        const nextRow = row + rowOffset
        const nextCol = col + colOffset
        if (inside(nextRow, nextCol) && board[nextRow][nextCol] === EMPTY) cells.add(`${nextRow},${nextCol}`)
      }
    }
  }
  occupied.forEach(([row, col]) => addAround(row, col, 2))
  if (lastMove) addAround(lastMove.row, lastMove.col, 2)
  ;[[CENTER, CENTER], [3, 3], [3, 11], [11, 3], [11, 11]].forEach(([row, col]) => {
    if (board[row][col] === EMPTY) cells.add(`${row},${col}`)
  })
  return [...cells].map((cell) => cell.split(',').map(Number))
}

const winningMoves = (board, stone, lastMove) => candidateMoves(board, lastMove).filter(([row, col]) => {
  put(board, row, col, stone)
  const result = hasFive(board, row, col, stone)
  put(board, row, col, EMPTY)
  return result
})

const threatMoves = (board, stone, lastMove, minimum = 30000) => candidateMoves(board, lastMove)
  .map(([row, col]) => ({ row, col, score: moveScore(board, row, col, stone) }))
  .filter(({ score }) => score >= minimum)
  .sort((left, right) => right.score - left.score)

const orderedMoves = (board, stone, lastMove, limit = 12) => threatMoves(board, stone, lastMove, 0)
  .slice(0, limit)

const boardKey = (board, depth, maximizing) => `${board.flat().join('')}:${depth}:${maximizing ? 'M' : 'm'}`

const evaluateBoard = (board, lastMove) => {
  const attack = orderedMoves(board, BLACK, lastMove, 4).reduce((sum, move, index) => sum + move.score / (index + 1), 0)
  const defense = orderedMoves(board, WHITE, lastMove, 4).reduce((sum, move, index) => sum + move.score / (index + 1), 0)
  const center = candidateMoves(board, lastMove).reduce((score, [row, col]) => score + (30 - Math.abs(row - CENTER) - Math.abs(col - CENTER)), 0)
  return attack * 1.25 - defense * 1.1 + center
}

const alphaBeta = (board, depth, maximizing, alpha, beta, lastMove, context) => {
  if (now() >= context.deadline || depth === 0) return evaluateBoard(board, lastMove)
  const key = boardKey(board, depth, maximizing)
  const cached = context.transposition.get(key)
  if (cached) return cached.value
  const stone = maximizing ? BLACK : WHITE
  const moves = orderedMoves(board, stone, lastMove, 10)
  if (!moves.length) return 0
  let best = maximizing ? -Infinity : Infinity
  for (const move of moves) {
    const next = cloneBoard(board)
    put(next, move.row, move.col, stone)
    const value = hasFive(next, move.row, move.col, stone)
      ? (maximizing ? 100000000 : -100000000)
      : alphaBeta(next, depth - 1, !maximizing, alpha, beta, { row: move.row, col: move.col }, context)
    if (maximizing) {
      best = Math.max(best, value)
      alpha = Math.max(alpha, best)
    } else {
      best = Math.min(best, value)
      beta = Math.min(beta, best)
    }
    if (beta <= alpha || now() >= context.deadline) break
  }
  context.transposition.set(key, { value: best })
  return best
}

const threatSpaceSearch = (board, attacker, depth, lastMove, context) => {
  if (depth <= 0 || now() >= context.deadline) return null
  const immediate = winningMoves(board, attacker, lastMove)
  if (immediate.length) return immediate[0]
  const forcing = threatMoves(board, attacker, lastMove, 4200).slice(0, 8)
  for (const move of forcing) {
    const next = cloneBoard(board)
    put(next, move.row, move.col, attacker)
    const threats = winningMoves(next, attacker, move)
    if (threats.length >= 2) return [move.row, move.col]
    if (threats.length !== 1) continue
    const reply = threats[0]
    put(next, reply[0], reply[1], attacker === BLACK ? WHITE : BLACK)
    if (hasFive(next, reply[0], reply[1], attacker === BLACK ? WHITE : BLACK)) continue
    const continuation = threatSpaceSearch(next, attacker, depth - 1, { row: reply[0], col: reply[1] }, context)
    if (continuation) return [move.row, move.col]
  }
  return null
}

const openingMove = (board) => {
  const occupied = occupiedCells(board)
  if (occupied.length === 0) return [CENTER, CENTER]
  if (occupied.length > 2) return null
  const opening = [[CENTER - 2, CENTER - 2], [CENTER - 2, CENTER + 2], [CENTER + 2, CENTER - 2], [CENTER + 2, CENTER + 2], [CENTER, CENTER - 2], [CENTER - 2, CENTER]]
  return opening.find(([row, col]) => board[row][col] === EMPTY) ?? null
}

export const chooseOmokMove = (board, lastMove = null, timeLimit = 30000) => {
  const opening = openingMove(board)
  if (opening) return opening
  const context = { deadline: now() + timeLimit, transposition: new Map() }
  const ownWin = winningMoves(board, BLACK, lastMove)[0]
  if (ownWin) return ownWin
  const opponentWins = winningMoves(board, WHITE, lastMove)
  if (opponentWins.length === 1) return opponentWins[0]
  const forced = threatSpaceSearch(board, BLACK, 5, lastMove, context)
  if (forced) return forced
  if (opponentWins.length > 1) return opponentWins[0]
  const moves = orderedMoves(board, BLACK, lastMove, 18)
  let bestMove = moves[0] ?? [CENTER, CENTER]
  let bestValue = -Infinity
  for (const move of moves) {
    if (now() >= context.deadline) break
    const next = cloneBoard(board)
    put(next, move.row, move.col, BLACK)
    const value = alphaBeta(next, 3, false, -Infinity, Infinity, move, context) + move.score * 0.35
    if (value > bestValue) {
      bestValue = value
      bestMove = [move.row, move.col]
    }
  }
  return bestMove
}
