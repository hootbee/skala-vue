<script setup>
import { computed, ref } from 'vue'

const BOARD_SIZE = 15
const EMPTY = 0
const PLAYER = 1
const COMPUTER = 2
const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]]

const createBoard = () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))

const board = ref(createBoard())
const turn = ref(PLAYER)
const winner = ref(null)
const isThinking = ref(false)
const lastMove = ref(null)
const historyKey = 'skala-omok-history'
const loadHistory = () => {
  if (typeof window === 'undefined') return []
  try {
    const saved = JSON.parse(window.localStorage.getItem(historyKey) || '[]')
    return Array.isArray(saved) ? saved.slice(0, 10) : []
  } catch {
    return []
  }
}
const gameHistory = ref(loadHistory())
const recordSaved = ref(false)
const recordSummary = computed(() => ({
  wins: gameHistory.value.filter(({ result }) => result === 'win').length,
  losses: gameHistory.value.filter(({ result }) => result === 'loss').length,
  draws: gameHistory.value.filter(({ result }) => result === 'draw').length,
}))

const statusText = computed(() => {
  if (winner.value === PLAYER) return '승리했습니다. 다시 두려면 새 게임을 시작하세요.'
  if (winner.value === COMPUTER) return '컴퓨터가 승리했습니다. 다시 도전해 보세요.'
  if (winner.value === 'draw') return '모든 칸이 채워졌습니다. 무승부입니다.'
  if (isThinking.value) return '컴퓨터가 다음 수를 찾고 있습니다.'
  return '당신의 차례입니다. 흑돌을 놓아 보세요.'
})

const saveResult = (result) => {
  if (recordSaved.value) return
  recordSaved.value = true
  const nextHistory = [{ result, playedAt: new Date().toISOString() }, ...gameHistory.value].slice(0, 10)
  gameHistory.value = nextHistory
  if (typeof window !== 'undefined') window.localStorage.setItem(historyKey, JSON.stringify(nextHistory))
}

const formatHistoryDate = (value) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const resultLabel = (result) => ({ win: '승리', loss: '패배', draw: '무승부' })[result]

const inside = (row, col) => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

const countDirection = (state, row, col, rowStep, colStep, stone) => {
  let count = 0
  let nextRow = row + rowStep
  let nextCol = col + colStep
  while (inside(nextRow, nextCol) && state[nextRow][nextCol] === stone) {
    count += 1
    nextRow += rowStep
    nextCol += colStep
  }
  return count
}

const hasFive = (state, row, col, stone) => DIRECTIONS.some(([rowStep, colStep]) => (
  1 + countDirection(state, row, col, rowStep, colStep, stone)
    + countDirection(state, row, col, -rowStep, -colStep, stone) >= 5
))

const availableCells = (state) => {
  const occupied = []
  state.forEach((line, row) => line.forEach((stone, col) => {
    if (stone !== EMPTY) occupied.push([row, col])
  }))
  if (!occupied.length) return [[Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)]]

  const candidates = new Set()
  occupied.forEach(([row, col]) => {
    for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
      for (let colOffset = -2; colOffset <= 2; colOffset += 1) {
        const nextRow = row + rowOffset
        const nextCol = col + colOffset
        if (inside(nextRow, nextCol) && state[nextRow][nextCol] === EMPTY) candidates.add(`${nextRow},${nextCol}`)
      }
    }
  })
  return [...candidates].map((cell) => cell.split(',').map(Number))
}

const lineScore = (state, row, col, rowStep, colStep, stone) => {
  const forward = countDirection(state, row, col, rowStep, colStep, stone)
  const backward = countDirection(state, row, col, -rowStep, -colStep, stone)
  const length = forward + backward + 1
  const forwardOpen = inside(row + (forward + 1) * rowStep, col + (forward + 1) * colStep)
    && state[row + (forward + 1) * rowStep][col + (forward + 1) * colStep] === EMPTY
  const backwardOpen = inside(row - (backward + 1) * rowStep, col - (backward + 1) * colStep)
    && state[row - (backward + 1) * rowStep][col - (backward + 1) * colStep] === EMPTY
  const openEnds = Number(forwardOpen) + Number(backwardOpen)
  if (length >= 5) return 100000
  if (length === 4 && openEnds === 2) return 10000
  if (length === 4 && openEnds === 1) return 1800
  if (length === 3 && openEnds === 2) return 900
  if (length === 3 && openEnds === 1) return 120
  if (length === 2 && openEnds === 2) return 80
  if (length === 2 && openEnds === 1) return 15
  return openEnds * 2
}

const scoreMove = (state, row, col, stone) => {
  if (state[row][col] !== EMPTY) return -Infinity
  state[row][col] = stone
  const score = DIRECTIONS.reduce((total, [rowStep, colStep]) => total + lineScore(state, row, col, rowStep, colStep, stone), 0)
  state[row][col] = EMPTY
  return score
}

const rankedCandidates = (state, stone, limit = 12) => availableCells(state)
  .map(([row, col]) => ({ row, col, score: scoreMove(state, row, col, stone) }))
  .sort((left, right) => right.score - left.score)
  .slice(0, limit)

const evaluatePosition = (state) => {
  const candidates = availableCells(state)
  if (!candidates.length) return 0
  let attack = 0
  let defense = 0
  candidates.forEach(([row, col]) => {
    attack = Math.max(attack, scoreMove(state, row, col, COMPUTER))
    defense = Math.max(defense, scoreMove(state, row, col, PLAYER))
  })
  return attack * 1.1 - defense
}

const minimax = (state, depth, maximizing, alpha, beta) => {
  if (depth === 0) return evaluatePosition(state)
  const stone = maximizing ? COMPUTER : PLAYER
  const moves = rankedCandidates(state, stone)
  if (!moves.length) return 0

  if (maximizing) {
    let best = -Infinity
    for (const move of moves) {
      const nextState = state.map((line) => [...line])
      nextState[move.row][move.col] = stone
      if (hasFive(nextState, move.row, move.col, stone)) return 1000000
      best = Math.max(best, minimax(nextState, depth - 1, false, alpha, beta))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  }

  let best = Infinity
  for (const move of moves) {
    const nextState = state.map((line) => [...line])
    nextState[move.row][move.col] = stone
    if (hasFive(nextState, move.row, move.col, stone)) return -1000000
    best = Math.min(best, minimax(nextState, depth - 1, true, alpha, beta))
    beta = Math.min(beta, best)
    if (beta <= alpha) break
  }
  return best
}

const chooseComputerMove = (state) => {
  const candidates = availableCells(state)
  const winningMove = candidates.find(([row, col]) => scoreMove(state, row, col, COMPUTER) >= 100000)
  if (winningMove) return winningMove
  const blockingMove = candidates.find(([row, col]) => scoreMove(state, row, col, PLAYER) >= 100000)
  if (blockingMove) return blockingMove

  const ranked = rankedCandidates(state, COMPUTER, 14)
  let bestMove = candidates[0]
  let bestScore = -Infinity
  ranked.forEach(({ row, col, score: attack }) => {
    const defense = scoreMove(state, row, col, PLAYER)
    const centerDistance = Math.abs(row - 7) + Math.abs(col - 7)
    const nextState = state.map((line) => [...line])
    nextState[row][col] = COMPUTER
    const replyScore = minimax(nextState, 2, false, -Infinity, Infinity)
    const score = replyScore + attack * 0.15 + defense * 0.08 + (30 - centerDistance)
    if (score > bestScore) {
      bestScore = score
      bestMove = [row, col]
    }
  })
  return bestMove
}

const finishMove = (stone, row, col) => {
  lastMove.value = { row, col }
  if (hasFive(board.value, row, col, stone)) {
    winner.value = stone
    saveResult(stone === PLAYER ? 'win' : 'loss')
  } else if (board.value.every((line) => line.every((cell) => cell !== EMPTY))) {
    winner.value = 'draw'
    saveResult('draw')
  } else {
    turn.value = stone === PLAYER ? COMPUTER : PLAYER
  }
}

const placeStone = (row, col) => {
  if (winner.value || isThinking.value || turn.value !== PLAYER || board.value[row][col] !== EMPTY) return
  const nextBoard = board.value.map((line) => [...line])
  nextBoard[row][col] = PLAYER
  board.value = nextBoard
  finishMove(PLAYER, row, col)
  if (winner.value || turn.value !== COMPUTER) return

  isThinking.value = true
  window.setTimeout(() => {
    const [computerRow, computerCol] = chooseComputerMove(board.value)
    const computerBoard = board.value.map((line) => [...line])
    computerBoard[computerRow][computerCol] = COMPUTER
    board.value = computerBoard
    isThinking.value = false
    finishMove(COMPUTER, computerRow, computerCol)
  }, 260)
}

const resetGame = () => {
  board.value = createBoard()
  turn.value = PLAYER
  winner.value = null
  isThinking.value = false
  lastMove.value = null
  recordSaved.value = false
}

const cellLabel = (row, col, stone) => {
  const column = String.fromCharCode(65 + col)
  const value = stone === PLAYER ? '내 흑돌' : stone === COMPUTER ? '컴퓨터 백돌' : '빈 칸'
  return `${column}${row + 1}, ${value}`
}
</script>

<template>
  <main class="omok-page">
    <header class="omok-header">
      <div>
        <p class="eyebrow">OMOK PLAYGROUND</p>
        <h1>알파고를 이겨라</h1>
        <p class="omok-intro">강한 룰베이스 컴퓨터와 한 판을 시작해 보세요.</p>
      </div>
      <button class="reset-button" type="button" @click="resetGame">새 게임</button>
    </header>

    <section class="omok-layout" aria-label="오목 게임">
      <div class="board-panel">
        <div class="board-meta"><span>15 × 15 자유룰</span><span>흑돌 선공</span></div>
        <div class="board" role="grid" aria-label="오목판">
          <button
            v-for="(cell, index) in board.flat()"
            :key="index"
            class="board-cell"
            :class="{ black: cell === PLAYER, white: cell === COMPUTER, latest: lastMove && Math.floor(index / BOARD_SIZE) === lastMove.row && index % BOARD_SIZE === lastMove.col }"
            type="button"
            role="gridcell"
            :aria-label="cellLabel(Math.floor(index / BOARD_SIZE), index % BOARD_SIZE, cell)"
            :disabled="Boolean(winner) || isThinking || cell !== EMPTY"
            @click="placeStone(Math.floor(index / BOARD_SIZE), index % BOARD_SIZE)"
          ><span v-if="cell" aria-hidden="true"></span></button>
        </div>
      </div>

      <aside class="game-info">
        <div class="status-panel" aria-live="polite">
          <p class="eyebrow">GAME STATUS</p>
          <strong>{{ statusText }}</strong>
        </div>
        <div class="rules-panel">
          <h2>플레이 안내</h2>
          <ul>
            <li>빈 칸을 선택하면 흑돌이 놓입니다.</li>
            <li>가로, 세로, 대각선으로 다섯 돌을 먼저 잇는 쪽이 승리합니다.</li>
          </ul>
          <span class="difficulty-badge">난이도 · 강함</span>
        </div>
        <div class="history-panel">
          <div class="history-heading"><h2>최근 전적</h2><span>최근 10게임</span></div>
          <div class="record-summary"><span>승 {{ recordSummary.wins }}</span><span>패 {{ recordSummary.losses }}</span><span>무 {{ recordSummary.draws }}</span></div>
          <p v-if="!gameHistory.length" class="empty-history">아직 기록된 게임이 없습니다.</p>
          <ul v-else class="history-list">
            <li v-for="(game, index) in gameHistory" :key="`${game.playedAt}-${index}`"><strong :class="`result-${game.result}`">{{ resultLabel(game.result) }}</strong><time :datetime="game.playedAt">{{ formatHistoryDate(game.playedAt) }}</time></li>
          </ul>
        </div>
        <div class="legend" aria-label="돌 색상 안내"><span><i class="legend-stone black"></i> 내 흑돌</span><span><i class="legend-stone white"></i> 컴퓨터 백돌</span></div>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.omok-page { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 44px 0 76px; color: var(--ink); }
.omok-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.eyebrow { margin: 0 0 8px; color: var(--blue-500); font-size: .7rem; font-weight: 900; letter-spacing: .16em; }
h1 { margin: 0; font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -.06em; }
.omok-intro { margin: 12px 0 0; color: var(--muted); font-size: .95rem; }
.reset-button { min-height: 42px; padding: 10px 17px; border: 1px solid var(--blue-200); border-radius: 10px; color: var(--blue-700); background: #fff; font: inherit; font-weight: 800; cursor: pointer; }
.reset-button:hover { background: var(--blue-100); }
.omok-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .38fr); gap: 24px; align-items: start; }
.board-panel, .status-panel, .rules-panel { border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }
.board-panel { padding: 20px; }
.board-meta { display: flex; justify-content: space-between; margin-bottom: 15px; color: var(--muted); font-size: .76rem; font-weight: 800; }
.board { display: grid; grid-template-columns: repeat(15, 1fr); aspect-ratio: 1; width: min(100%, 680px); margin: 0 auto; padding: 14px; border: 1px solid #c5a575; border-radius: 12px; background: #e6c58d; box-shadow: inset 0 0 0 1px rgba(255,255,255,.3); }
.board-cell { position: relative; display: grid; aspect-ratio: 1; min-width: 0; min-height: 0; place-items: center; padding: 0; border: 0; background: transparent; cursor: pointer; }
.board-cell::before { position: absolute; width: 100%; height: 1px; background: rgba(83, 61, 34, .42); content: ''; }
.board-cell::after { position: absolute; width: 1px; height: 100%; background: rgba(83, 61, 34, .42); content: ''; }
.board-cell span { z-index: 1; width: 72%; height: 72%; border-radius: 50%; box-shadow: 0 2px 3px rgba(38, 29, 18, .28); }
.board-cell.black span { background: radial-gradient(circle at 35% 30%, #5f6871, #111820 68%); }
.board-cell.white span { border: 1px solid #a9b6bf; background: radial-gradient(circle at 35% 30%, #fff, #d4dce1 70%); }
.board-cell.latest span { outline: 3px solid rgba(31, 125, 184, .82); outline-offset: 2px; }
.board-cell:focus-visible, .reset-button:focus-visible { outline: 3px solid #f3a738; outline-offset: 2px; }
.game-info { display: grid; gap: 16px; }
.status-panel, .rules-panel { padding: 22px; }
.status-panel strong { display: block; color: var(--ink); font-size: 1.15rem; line-height: 1.55; }
.rules-panel h2 { margin: 0 0 12px; font-size: 1.05rem; }
.rules-panel ul { display: grid; gap: 10px; margin: 0 0 15px; padding-left: 19px; color: var(--muted); font-size: .84rem; line-height: 1.6; }
.difficulty-badge { display: inline-flex; padding: 6px 9px; border-radius: 7px; color: var(--blue-700); background: var(--blue-100); font-size: .72rem; font-weight: 800; }
.history-panel { padding: 4px; color: var(--ink); }
.history-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }.history-heading h2 { margin: 0; font-size: 1.05rem; }.history-heading span { color: var(--muted); font-size: .7rem; }
.record-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-bottom: 12px; }.record-summary span { padding: 8px 5px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: var(--surface); font-size: .75rem; font-weight: 800; text-align: center; }
.empty-history { margin: 0; color: var(--muted); font-size: .78rem; }.history-list { display: grid; gap: 7px; max-height: 190px; margin: 0; padding: 0; overflow: auto; list-style: none; }.history-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border-bottom: 1px solid var(--line); font-size: .76rem; }.history-list time { color: var(--muted); font-size: .7rem; }.result-win { color: #14734f; }.result-loss { color: #b44242; }.result-draw { color: var(--muted); }
.legend { display: flex; flex-wrap: wrap; gap: 14px; padding: 0 4px; color: var(--muted); font-size: .78rem; font-weight: 700; }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend-stone { display: inline-block; width: 15px; height: 15px; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,.2); }.legend-stone.black { background: #17212a; }.legend-stone.white { border: 1px solid #a9b6bf; background: #f4f7f8; }
@media (max-width: 760px) { .omok-page { width: min(100% - 24px, 1120px); padding-top: 28px; }.omok-header { align-items: flex-start; flex-direction: column; gap: 17px; }.omok-layout { grid-template-columns: 1fr; }.board-panel { padding: 12px; }.board { padding: 8px; }.game-info { grid-template-columns: 1fr; } }
</style>
