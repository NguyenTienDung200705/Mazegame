// game.js (FIXED – giữ nguyên kiến trúc, grid thẳng hàng, fix server error + data format)
import { checkWin } from './utils.js';
import { updatePlayerMetrics } from './metrics.js';

const SERVER_URL = 'http://localhost:8080';

export let mazeData = {};
export let playerX = 0, playerY = 0;
export let goalX = 0, goalY = 0;
export let currentDifficulty = 25;
export let persistentPath = [];
export let pathFound = false;

// ================= START GAME =================
export function startGame(
  diff,
  runningAlgo,
  algoInterval,
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

  if (algoInterval) clearInterval(algoInterval);
  runningAlgo = false;

  fetch(`${SERVER_URL}/generateMaze?difficulty=${diff}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); // ✅ FIX: Kiểm tra server response
      return res.json();
    })
    .then(data => {
      console.log('Dữ liệu mê cung nhận được:', data);
      mazeData = data;
      updatePlayerPos(data);
      updateGoalPos(data);
      drawMaze(data, pathFound, persistentPath);
      hideAllSections([]);
      mazeContainer.style.display = 'block';
      resetPlayerMetrics();
      successMessage.style.opacity = '0';
      document.removeEventListener('keydown', handleKey);
      document.addEventListener('keydown', handleKey);
    })
    .catch(err => {
      console.error('Lỗi tạo mê cung:', err); // ✅ FIX: Log chi tiết error
      alert('Không thể tạo mê cung. Kiểm tra server tại ' + SERVER_URL + ' và console log.');
    });
}

// ================= PLAYER / GOAL =================
export function updatePlayerPos(data) {
  // ✅ FIX: Hỗ trợ cả format cells và array
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
  // ✅ FIX: Hỗ trợ cả format cells và array
  const cells = data.cells || data;
  if (Array.isArray(cells)) {
    cells.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 3) { goalX = i; goalY = j; }
      })
    );
  }
}

// ================= DRAW MAZE =================
export function drawMaze(data, pathFound, persistentPath) {
  const mazeDiv = document.getElementById('maze');
  mazeDiv.innerHTML = '';

  if (!data || (!data.cells && !Array.isArray(data))) {
    console.error('Maze data không hợp lệ');
    return;
  }

  // ✅ FIX: Hỗ trợ cả format line-based và cell-based
  let cells, hWalls, vWalls, ROWS, COLS;
  if (data.hWalls && data.vWalls && data.cells) {
    // Line-based
    cells = data.cells;
    hWalls = data.hWalls;
    vWalls = data.vWalls;
    ROWS = cells.length;
    COLS = cells[0].length;
    console.log('Sử dụng line-based');
  } else if (Array.isArray(data) && data.length > 0) {
    // Cell-based fallback
    cells = data;
    ROWS = cells.length;
    COLS = cells[0].length;
    console.log('Sử dụng cell-based');
  } else {
    console.error('Format data không hỗ trợ');
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
      cell.style.width = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      cell.style.boxSizing = 'border-box';
      cell.style.position = 'relative';
      cell.style.background = '#f0f0f0'; // Default path trắng nhạt
      cell.style.margin = '0';
      cell.style.padding = '0';

      const val = cells[i][j];

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

// ================= HANDLE KEY =================
export function handleKey(
  e,
  mazeContainer,
  runningAlgo,
  pathFound,
  playerSteps,
  playerNodes,
  updatePlayerPos,
  drawMaze,
  updatePlayerMetrics,
  playerTimer, // ✅ FIX: Thêm params cho checkWin
  successMessage
) {
  if (mazeContainer.style.display !== 'block' || runningAlgo || pathFound) return;

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
      drawMaze(data, pathFound, persistentPath);
      updatePlayerMetrics();
      checkWin(playerX, playerY, goalX, goalY, playerTimer, successMessage); // ✅ FIX: Params đầy đủ
    })
    .catch(err => console.error('Lỗi di chuyển:', err));
}