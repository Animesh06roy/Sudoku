// --- SUDOKU GAME LOGIC & UI ---

// Utility functions for Sudoku generation and validation

// Generate a full Sudoku board using backtracking
function generateFullBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board, 0, 0);
  return board;
}

// Backtracking fill
function fillBoard(board, row, col) {
  if (row === 9) return true;
  if (col === 9) return fillBoard(board, row + 1, 0);

  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (let num of nums) {
    if (isSafe(board, row, col, num)) {
      board[row][col] = num;
      if (fillBoard(board, row, col + 1)) return true;
      board[row][col] = 0;
    }
  }
  return false;
}

// Check if placing num at board[row][col] is valid
function isSafe(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const boxRow = row - row % 3, boxCol = col - col % 3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[boxRow + i][boxCol + j] === num) return false;
  return true;
}

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Remove numbers to create a puzzle with unique solution
function generatePuzzle(fullBoard, clues = 35) {
  const puzzle = fullBoard.map(row => row.slice());
  let removed = 81 - clues;
  while (removed > 0) {
    const i = Math.floor(Math.random() * 9);
    const j = Math.floor(Math.random() * 9);
    if (puzzle[i][j] !== 0) {
      const backup = puzzle[i][j];
      puzzle[i][j] = 0;
      // Check for unique solution
      if (!hasUniqueSolution(puzzle)) {
        puzzle[i][j] = backup;
      } else {
        removed--;
      }
    }
  }
  return puzzle;
}

// Check for unique solution by counting solutions (backtracking)
function hasUniqueSolution(board) {
  let count = 0;
  function solve(bd, r, c) {
    if (r === 9) { count++; return count < 2; }
    if (c === 9) return solve(bd, r + 1, 0);
    if (bd[r][c] !== 0) return solve(bd, r, c + 1);
    for (let num = 1; num <= 9; num++) {
      if (isSafe(bd, r, c, num)) {
        bd[r][c] = num;
        if (!solve(bd, r, c + 1)) { bd[r][c] = 0; return false; }
        bd[r][c] = 0;
      }
    }
    return true;
  }
  solve(board.map(row => row.slice()), 0, 0);
  return count === 1;
}

// --- UI & GAME STATE ---

let solution = [];
let puzzle = [];
let prefilled = [];
let timer = 0;
let timerInterval = null;
let stats = {
  solved: 0,
  fastest: null,
  totalTime: 0
};
const boardElem = document.getElementById('sudoku-board');
const messageElem = document.getElementById('message');
const timerElem = document.getElementById('timer');
const statsElem = document.getElementById('stats');

// Load stats from localStorage
function loadStats() {
  const saved = localStorage.getItem('sudokuStats');
  if (saved) {
    stats = JSON.parse(saved);
  }
}

// Save stats to localStorage
function saveStats() {
  localStorage.setItem('sudokuStats', JSON.stringify(stats));
}

// Format time in mm:ss
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Render stats
function renderStats() {
  statsElem.innerHTML = `
    <strong>Puzzles Solved:</strong> ${stats.solved} &nbsp; 
    <strong>Fastest:</strong> ${stats.fastest ? formatTime(stats.fastest) : '--'} &nbsp;
    <strong>Total Time:</strong> ${formatTime(stats.totalTime)}
    <button id="reset-stats-btn" style="margin-left:1em;">Reset Stats</button>
  `;
  document.getElementById('reset-stats-btn').onclick = () => {
    if (confirm('Reset all stats?')) {
      stats = { solved: 0, fastest: null, totalTime: 0 };
      saveStats();
      renderStats();
    }
  };
}

// Start timer
function startTimer() {
  timer = 0;
  timerElem.textContent = `Time: ${formatTime(timer)}`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    timerElem.textContent = `Time: ${formatTime(timer)}`;
  }, 1000);
}

// Stop timer
function stopTimer() {
  clearInterval(timerInterval);
}

// Render Sudoku board
function renderBoard() {
  boardElem.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.className = 'sudoku-cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      if (puzzle[i][j] !== 0) {
        cell.value = puzzle[i][j];
        cell.classList.add('prefilled');
        cell.readOnly = true;
      } else {
        cell.value = '';
        cell.addEventListener('input', onCellInput);
        cell.addEventListener('keydown', onCellKeyDown);
      }
      boardElem.appendChild(cell);
    }
  }
}

// Handle input in cells
function onCellInput(e) {
  const cell = e.target;
  const val = cell.value;
  if (!/^[1-9]$/.test(val)) {
    cell.value = '';
    cell.classList.remove('invalid');
    return;
  }
  const row = +cell.dataset.row, col = +cell.dataset.col;
  puzzle[row][col] = Number(val);
  validateBoard();
}

// Keyboard navigation
function onCellKeyDown(e) {
  const cell = e.target;
  const row = +cell.dataset.row, col = +cell.dataset.col;
  let next;
  if (e.key === "ArrowRight" && col < 8) next = document.querySelector(`[data-row="${row}"][data-col="${col+1}"]`);
  if (e.key === "ArrowLeft" && col > 0) next = document.querySelector(`[data-row="${row}"][data-col="${col-1}"]`);
  if (e.key === "ArrowDown" && row < 8) next = document.querySelector(`[data-row="${row+1}"][data-col="${col}"]`);
  if (e.key === "ArrowUp" && row > 0) next = document.querySelector(`[data-row="${row-1}"][data-col="${col}"]`);
  if (next) { e.preventDefault(); next.focus(); }
}

// Validate board and highlight invalid cells
function validateBoard() {
  let valid = true;
  document.querySelectorAll('.sudoku-cell').forEach(cell => {
    if (cell.classList.contains('prefilled')) return;
    const row = +cell.dataset.row, col = +cell.dataset.col, val = cell.value;
    cell.classList.remove('invalid');
    if (val && !isValidEntry(puzzle, row, col, Number(val))) {
      cell.classList.add('invalid');
      valid = false;
    }
  });
  return valid;
}

// Check if entry at (row, col) is valid for current puzzle
function isValidEntry(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === num) return false;
    if (i !== row && board[i][col] === num) return false;
  }
  const boxRow = row - row % 3, boxCol = col - col % 3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if ((boxRow + i !== row || boxCol + j !== col) && board[boxRow + i][boxCol + j] === num)
        return false;
  return true;
}

// Check solution
function checkSolution() {
  if (!validateBoard()) {
    showMessage('Please fix the errors highlighted in red.', 'error');
    return;
  }
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (puzzle[i][j] !== solution[i][j]) {
        showMessage('Incorrect solution. Try again!', 'error');
        return;
      }
  showMessage('Congratulations! Puzzle solved!', 'success');
  document.querySelectorAll('.sudoku-cell').forEach(cell => cell.classList.add('solved'));
  stopTimer();
  stats.solved++;
  stats.totalTime += timer;
  if (!stats.fastest || timer < stats.fastest) stats.fastest = timer;
  saveStats();
  renderStats();
}

// Show message
function showMessage(msg, type) {
  messageElem.textContent = msg;
  messageElem.style.color = type === 'success' ? 'var(--success)' : 'var(--error)';
}

// Reset board (only user inputs)
function resetBoard() {
  if (!confirm('Reset your current inputs?')) return;
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (!prefilled[i][j]) puzzle[i][j] = 0;
  renderBoard();
  showMessage('Board reset.', 'success');
}

// Generate new puzzle
function newGame(difficulty = 'medium') {
  let clues;
  if (difficulty === 'easy') clues = 40;
  else if (difficulty === 'hard') clues = 28;
  else clues = 32;
  solution = generateFullBoard();
  puzzle = generatePuzzle(solution, clues);
  prefilled = puzzle.map(row => row.map(cell => cell !== 0));
  renderBoard();
  showMessage('');
  startTimer();
}

// Hint: fill one empty cell correctly
function giveHint() {
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (puzzle[i][j] === 0) {
        puzzle[i][j] = solution[i][j];
        renderBoard();
        showMessage('Hint used!', 'success');
        return;
      }
  showMessage('No empty cells left for hint.', 'error');
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
}

// --- EVENT LISTENERS ---

document.getElementById('check-btn').onclick = checkSolution;
document.getElementById('reset-btn').onclick = resetBoard;
document.getElementById('new-game-btn').onclick = () => newGame();
document.getElementById('hint-btn').onclick = giveHint;
document.getElementById('toggle-theme-btn').onclick = toggleTheme;

// --- INITIALIZATION ---

loadStats();
renderStats();
newGame();
