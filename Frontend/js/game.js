// game.js (UPDATED – thêm tính năng chọn start/goal bằng click, hỗ trợ selectionMode, FIX multiple resets by guarding algo runs + handle JSON formats + FIXED v8.1: Direct pass updateAlgoMetrics (3 params) - no bind, numbers pass clean to metrics)
// FIXED v8.3: Use stopAlgo() instead of direct algoRunning = false (avoids const assignment error if runningAlgo is const in algo.js); add resetPositions() for safe reset from main.js; remove unused runningAlgo param
import { checkWin } from './utils.js';
import { updatePlayerMetrics, updateAlgoMetrics } from './metrics.js';  // Import updateAlgoMetrics (3 params, auto-DOM)
import { runAlgo, stopAlgo, runningAlgo as algoRunning } from './algo.js';  // Import from algo.js + guard (read-only check)

const SERVER_URL = 'http://localhost:8080';

export let mazeData = {};
export let playerX = 0, playerY = 0;
export let goalX = 0, goalY = 0;
export let currentDifficulty = 25;
export let persistentPath = [];
export let pathFound = false;
export let selectionMode = null;  // 'start' or 'goal' or null

// ================= NEW: Safe reset positions (call from main.js reset to avoid direct assignment issues) =================
export function resetPositions() {
  playerX = 0;
  playerY = 0;
  goalX = 0;
  goalY = 0;
  selectionMode = null;
  console.log('🔄 Positions reset: start/goal cleared');
}

// ================= START GAME ================= (FIXED: Use stopAlgo() instead of direct assignment to algoRunning; remove unused runningAlgo param)
export function startGame(
  diff,
  algoInterval,  // <-- FIXED: Remove runningAlgo param (use global alias for check only)
  resetPlayerMetrics,
  updatePlayerPos,
  updateGoalPos,
  drawMaze,
  hideAllSections,
  mazeContainer,
  successMessage,
  handleKey
) {
  currentDifficulty = diff;
  persistentPath = [];
  pathFound = false;
  selectionMode = null;  // Reset mode

  if (algoInterval) clearInterval(algoInterval);
  
  // FIXED v8.3: Call stopAlgo() to reset running state safely (avoids direct assignment to potentially const algoRunning)
  stopAlgo();  // This should set algoRunning = false internally in algo.js

  fetch(`${SERVER_URL}/generateMaze?difficulty=${diff}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('Dữ liệu mê cung nhận được:', data);
      mazeData = data;
      updatePlayerPos(data);
      updateGoalPos(data);
      drawMaze(data, pathFound, persistentPath, selectionMode);  // Pass selectionMode
      hideAllSections([]);
      mazeContainer.style.display = 'block';
      resetPlayerMetrics();
      successMessage.style.opacity = '0';
      document.removeEventListener('keydown', handleKey);
      document.addEventListener('keydown', handleKey);

      // Setup click listener for selection
      setupMazeClicks();

      // FIXED: Re-enable algo buttons after generate (if disabled)
      const runAStarBtn = document.getElementById('runAStarBtn');  // Assume button ID
      if (runAStarBtn) {
        runAStarBtn.disabled = false;
        runAStarBtn.textContent = 'Run A*';
      }
    })
    .catch(err => {
      console.error('Lỗi tạo mê cung:', err);
      alert('Không thể tạo mê cung. Kiểm tra server tại ' + SERVER_URL + ' và console log.');
    });
}

// FIXED v8.1: Run algorithm with DIRECT pass updateAlgoMetrics (3 params fn - metrics auto-finds spans, no bind/param shift)
export async function runAlgorithm(algoEndpoint, algoMetrics, event) {  // e.g., '/stepAStar'
  console.log('UI: Attempting to run algo:', algoEndpoint);

  // FIXED: Global guard - prevent multiple runs (read-only check)
  if (algoRunning) {
    console.warn('UI: Algo already running - ignore');
    return;
  }

  // FIXED: Disable button to prevent spam clicks
  const runBtn = event?.target || document.querySelector(`[onclick*="run${algoEndpoint}"]`);  // Flexible
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
  }

  // FIXED: Get goal from global exports
  const localGoalX = goalX;
  const localGoalY = goalY;

  if (localGoalX === 0 && localGoalY === 0) {
    alert('Vui lòng chọn điểm kết thúc trước!');
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = 'Run A*';
    }
    return;
  }

  // FIXED v8.1: Direct pass updateAlgoMetrics (3 params: time/path/expanded numbers) - metrics auto-updates DOM spans
  // No bind, no shift - clean numbers pass (23/186/453 → raw params time=23)
  try {
    await runAlgo(
      algoEndpoint,
      localGoalX,
      localGoalY,
      mazeData,
      persistentPath,
      stopAlgo,
      updateAlgoMetrics,  // <-- FIXED: Direct fn (receives numbers, auto-finds/updates spans)
      algoMetrics  // Passed for fallback in metrics if needed
    );
    console.log('UI: Algo started - direct metrics fn (numbers to auto-DOM)');
  } catch (err) {
    console.error('UI: Algo start error:', err);
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = 'Run Failed';
    }
  }
}

// Optional: Manual stop (from stop button)
export function manualStopAlgo() {
  stopAlgo();
  const runBtn = document.getElementById('runAStarBtn');
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.textContent = 'Run A*';
  }
  console.log('UI: Manual stop triggered');
}

// New: Setup click events on maze cells
function setupMazeClicks() {
  const mazeDiv = document.getElementById('maze');
  // Remove existing listener if any (to avoid duplicates)
  mazeDiv.removeEventListener('click', handleMazeClick);
  mazeDiv.addEventListener('click', handleMazeClick);
}

function handleMazeClick(e) {
  if (!selectionMode) return;

  const cell = e.target.closest('.cell');
  if (!cell) return;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  if (isNaN(row) || isNaN(col)) return;

  // Get current val to check if wall (client-side check)
  const cells = mazeData.cells || mazeData;
  const val = Array.isArray(cells) && cells[row] && cells[row][col] !== undefined ? cells[row][col] : 1;
  if (val === 1) {
    alert('Không thể chọn vị trí tường!');
    return;
  }

  console.log(`Clicked cell: row=${row}, col=${col}, mode=${selectionMode}`);

  const endpoint = selectionMode === 'start' ? '/setStart' : '/setGoal';
  fetch(`${SERVER_URL}${endpoint}?x=${row}&y=${col}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      mazeData = data;
      const mode = selectionMode;  // FIXED: Save mode trước reset
      if (mode === 'start') {
        playerX = row;
        playerY = col;
        updatePlayerPos(data);
      } else {
        goalX = row;
        goalY = col;
        updateGoalPos(data);
      }
      drawMaze(data, pathFound, persistentPath, null);  // Redraw without mode
      selectionMode = null;  // Reset mode after selection
      alert(`${mode.toUpperCase()} selected at (${row}, ${col})!`);  // FIXED: Use saved mode
    })
    .catch(err => console.error('Lỗi set position:', err));
}

// Export: Set selection mode (call from UI buttons, e.g., onclick)
export function setSelectionMode(mode) {
  if (!['start', 'goal'].includes(mode)) {
    console.error('Invalid mode:', mode);
    return;
  }
  selectionMode = mode;
  console.log(`Selection mode: ${mode} – Click on a non-wall cell to select.`);
  // Redraw to show visual feedback
  drawMaze(mazeData, pathFound, persistentPath, selectionMode);
}

// ================= PLAYER / GOAL =================
export function updatePlayerPos(data) {
  const cells = data.cells || data;
  if (Array.isArray(cells)) {
    cells.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 2) { playerX = i; playerY = j; }
      })
    );
  }
}

export function updateGoalPos(data) {
  const cells = data.cells || data;
  if (Array.isArray(cells)) {
    cells.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 3) { goalX = i; goalY = j; }
      })
    );
  }
}

// ================= DRAW MAZE ================= (fixed: handle object with "cells" or direct array)
export function drawMaze(data, pathFound, persistentPath, selectionMode = null) {
  const mazeDiv = document.getElementById('maze');
  mazeDiv.innerHTML = '';

  if (!data || (!data.cells && !Array.isArray(data))) {
    console.error('Maze data không hợp lệ:', data);  // FIXED: Log data để debug
    return;
  }

  // FIXED: Robust - handle object {cells: [...]} or direct array
  let cells, hWalls, vWalls, ROWS, COLS;
  if (data.hWalls && data.vWalls && data.cells) {
    // Line-based
    cells = data.cells;
    hWalls = data.hWalls;
    vWalls = data.vWalls;
    ROWS = cells.length;
    COLS = cells[0].length;
    console.log('Sử dụng line-based');
  } else if (Array.isArray(data)) {
    // Direct array (old backend)
    cells = data;
    ROWS = cells.length;
    COLS = cells[0].length;
    console.log('Sử dụng direct array');
  } else if (data.cells && Array.isArray(data.cells)) {
    // Object with cells (new backend)
    cells = data.cells;
    ROWS = cells.length;
    COLS = cells[0].length;
    console.log('Sử dụng object with cells');
  } else {
    console.error('Format data không hỗ trợ:', data);  // FIXED: Log data để trace
    return;
  }

  // 🔒 GRID CỐ ĐỊNH → KHÔNG LỆCH, Ô BÉ ĐỀU
  const CELL_SIZE = 20; // Bé hơn, thẳng hàng
  const WALL_THICK = 1;

  const grid = document.createElement('div');
  grid.style.display = 'inline-block';
  grid.style.border = '4px solid #222'; // Viền ngoài đậm
  grid.style.background = '#f0f0f0'; // Nền xám nhạt cho path

  for (let i = 0; i <= ROWS; i++) {
    // ===== HORIZONTAL WALL =====
    const hRow = document.createElement('div');
    hRow.style.display = 'flex';
    hRow.style.height = `${WALL_THICK}px`;

    for (let j = 0; j < COLS; j++) {
      const seg = document.createElement('div');
      seg.style.width = `${CELL_SIZE}px`;
      seg.style.height = '100%';
      seg.style.background = (i === 0 || i === ROWS || (hWalls && hWalls[i] && hWalls[i][j])) ? '#333' : '#ccc';
      hRow.appendChild(seg);
    }
    grid.appendChild(hRow);

    if (i === ROWS) break;

    // ===== CELL ROW =====
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';

    for (let j = 0; j < COLS; j++) {
      // VERTICAL WALL
      const vWall = document.createElement('div');
      vWall.style.width = `${WALL_THICK}px`;
      vWall.style.height = `${CELL_SIZE}px`;
      vWall.style.background = (j === 0 || (vWalls && vWalls[i] && vWalls[i][j])) ? '#333' : '#ccc';
      rowDiv.appendChild(vWall);

      // CELL
      const cell = document.createElement('div');
      cell.classList.add('cell');  // New: For click detection
      cell.dataset.row = i;  // New: For position
      cell.dataset.col = j;  // New: For position
      cell.style.width = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      cell.style.boxSizing = 'border-box';
      cell.style.position = 'relative';
      cell.style.background = '#f0f0f0'; // Default path trắng nhạt
      cell.style.margin = '0';
      cell.style.padding = '0';

      // New: Selection mode styles (only on non-wall cells)
      const val = cells[i][j];
      if (selectionMode && val !== 1) {
        cell.style.cursor = 'pointer';
        cell.style.opacity = '0.8';
        cell.style.border = '2px dashed #007bff';  // Blue dashed for selectable
      } else if (selectionMode && val === 1) {
        cell.style.cursor = 'not-allowed';
        cell.style.opacity = '0.5';
      }

      if (val === 1) {
        cell.style.background = '#222'; // Wall đen
      }

      if (val === 2) {
        cell.style.background = '#00c800'; // Player xanh
        cell.style.border = '2px solid #006400';
        const label = document.createElement('span');
        label.textContent = 'START';
        label.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:8px;font-weight:bold;color:black;';
        cell.appendChild(label);
      }

      if (val === 3) {
        cell.style.background = '#e60000'; // Goal đỏ
        cell.style.border = '2px solid #990000';
        const label = document.createElement('span');
        label.textContent = 'GOAL';
        label.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:8px;font-weight:bold;color:white;';
        cell.appendChild(label);
      }

      if (val === 4) cell.style.background = '#7CFC00'; // Visited
      if (val === 5 || (pathFound && persistentPath.some(p => p.x === i && p.y === j))) cell.style.background = '#ff8080'; // Path

      rowDiv.appendChild(cell);
    }

    // RIGHT OUTER WALL
    const rightWall = document.createElement('div');
    rightWall.style.width = `${WALL_THICK}px`;
    rightWall.style.height = `${CELL_SIZE}px`;
    rightWall.style.background = '#333';
    rowDiv.appendChild(rightWall);

    grid.appendChild(rowDiv);
  }

  mazeDiv.appendChild(grid);
  mazeDiv.style.width = `${COLS * CELL_SIZE + (COLS + 1) * WALL_THICK}px`; // Fit width
  mazeDiv.style.height = `${ROWS * CELL_SIZE + (ROWS + 1) * WALL_THICK}px`; // Fit height
}

// ================= HANDLE KEY ================= (updated: pass selectionMode to drawMaze; FIXED: Use global algoRunning for check)
export function handleKey(
  e,
  mazeContainer,
  algoInterval,  // <-- FIXED: Pass algoInterval if needed, but use global for running check
  pathFound,
  playerSteps,
  playerNodes,
  updatePlayerPos,
  drawMaze,
  updatePlayerMetrics,
  playerTimer, // ✅ FIX: Thêm params cho checkWin
  successMessage
) {
  if (mazeContainer.style.display !== 'block' || algoRunning || pathFound) return;  // <-- FIXED: Use global algoRunning (read-only)

  let dir = null;
  if (e.key === 'w' || e.key === 'ArrowUp') dir = 'UP';
  if (e.key === 's' || e.key === 'ArrowDown') dir = 'DOWN';
  if (e.key === 'a' || e.key === 'ArrowLeft') dir = 'LEFT';
  if (e.key === 'd' || e.key === 'ArrowRight') dir = 'RIGHT';

  if (!dir) return;

  fetch(`${SERVER_URL}/playerMove?dir=${dir}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); // ✅ FIX: Kiểm tra server
      return res.json();
    })
    .then(data => {
      mazeData = data;
      playerSteps++;
      playerNodes++;
      updatePlayerPos(data);
      drawMaze(data, pathFound, persistentPath, selectionMode);  // Pass selectionMode
      updatePlayerMetrics();
      checkWin(playerX, playerY, goalX, goalY, playerTimer, successMessage); // ✅ FIX: Params đầy đủ
    })
    .catch(err => console.error('Lỗi di chuyển:', err));
}

// ================= INIT (optional - add to main.js or here) =================
document.addEventListener('DOMContentLoaded', () => {
  // FIXED: Setup algo buttons with guard (assume IDs: runAStarBtn, stopAlgoBtn)
  const runAStarBtn = document.getElementById('runAStarBtn');
  const stopAlgoBtn = document.getElementById('stopAlgoBtn');
  if (runAStarBtn) {
    runAStarBtn.addEventListener('click', (e) => runAlgorithm('/stepAStar', document.getElementById('algoMetrics'), e));
  }
  if (stopAlgoBtn) {
    stopAlgoBtn.addEventListener('click', manualStopAlgo);
  }

  // FIXED: Disable stop initially
  if (stopAlgoBtn) stopAlgoBtn.disabled = true;
});