const SERVER_URL = 'http://localhost:8080';

let mazeData = {};
let playerX = 0, playerY = 0;
let goalX = 0, goalY = 0;
let playerStartTime = Date.now();
let playerSteps = 0;
let playerNodes = 1;
let runningAlgo = false;
let algoInterval;
let algoStartTime;
let pathLength = 0;
let nodeExpanded = 0;
let currentDifficulty = 25;
let persistentPath = [];
let pathFound = false; // ✅ Flag để biết đã tìm thấy đường

// DOM Elements
const readyBtn = document.getElementById('readyBtn');
const welcome = document.getElementById('welcome');
const modeSelection = document.getElementById('modeSelection');
const difficultySelection = document.getElementById('difficultySelection');
const mazeContainer = document.getElementById('mazeContainer');
const mazeDiv = document.getElementById('maze');
const successMessage = document.getElementById('successMessage');
const timeSpan = document.getElementById('time');
const stepsSpan = document.getElementById('steps');
const nodesSpan = document.getElementById('nodes');
const algoTimeSpan = document.getElementById('algoTime');
const pathLenSpan = document.getElementById('pathLen');
const expandedSpan = document.getElementById('expanded');
const algoMetrics = document.getElementById('algoMetrics');

// Back Buttons
const backToWelcome = document.getElementById('backToWelcome');
const backToMode = document.getElementById('backToMode');

// Events for Navigation
document.getElementById('readyBtn').onclick = () => {
  hideAllSections();
  modeSelection.style.display = 'flex';
};

backToWelcome.onclick = () => {
  hideAllSections();
  welcome.style.display = 'flex';
};

document.getElementById('randomBtn').onclick = () => {
  currentDifficulty = 25;
  startGame(currentDifficulty);
};

document.getElementById('levelBtn').onclick = () => {
  hideAllSections();
  difficultySelection.style.display = 'flex';
};

backToMode.onclick = () => {
  hideAllSections();
  modeSelection.style.display = 'flex';
};

difficultySelection.querySelectorAll('button[data-diff]').forEach(btn => {
  btn.onclick = () => {
    currentDifficulty = parseInt(btn.dataset.diff);
    startGame(currentDifficulty);
  };
});

// Algo Buttons
document.getElementById('dfsBtn').onclick = () => runAlgo('/stepDFS');
document.getElementById('bfsBtn').onclick = () => runAlgo('/stepBFS');
document.getElementById('astarBtn').onclick = () => runAlgo('/stepAStar');

// Reset Button
document.getElementById('resetBtn').onclick = () => {
  const diff = prompt('Chọn mức độ (10=dễ, 25=trung bình, 40=khó):') || currentDifficulty;
  startGame(parseInt(diff));
};

// Utility: Hide all sections
function hideAllSections() {
  [welcome, modeSelection, difficultySelection, mazeContainer].forEach(s => s.style.display = 'none');
}

// Game Functions
function startGame(diff) {
  currentDifficulty = diff;
  persistentPath = [];
  pathFound = false;
  if (algoInterval) clearInterval(algoInterval);
  runningAlgo = false;
  fetch(`${SERVER_URL}/generateMaze?difficulty=${diff}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('Dữ liệu mê cung nhận được:', data);
      mazeData = data;
      updatePlayerPos();
      updateGoalPos();
      drawMaze();
      hideAllSections();
      mazeContainer.style.display = 'block';
      resetPlayerMetrics();
      successMessage.style.opacity = '0';
      document.removeEventListener('keydown', handleKey);
      document.addEventListener('keydown', handleKey);
    })
    .catch(err => {
      console.error('Lỗi tạo mê cung:', err);
      alert('Không thể tạo mê cung. Kiểm tra server tại ' + SERVER_URL + ' và console log.');
    });
}

function updatePlayerPos() {
  if (mazeData.cells) {
    mazeData.cells.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 2) { playerX = i; playerY = j; }
      })
    );
  } else if (Array.isArray(mazeData)) {
    mazeData.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 2) { playerX = i; playerY = j; }
      })
    );
  }
}

function updateGoalPos() {
  if (mazeData.cells) {
    mazeData.cells.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 3) { goalX = i; goalY = j; }
      })
    );
  } else if (Array.isArray(mazeData)) {
    mazeData.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (cell === 3) { goalX = i; goalY = j; }
      })
    );
  }
}

// 🎯 HÀM VẼ MÊ CUNG - ĐÍCH MÀU ĐỎ NỔI BẬT, GIỮ ĐƯỜNG ĐI SAU KHI TÌM THẤY
function drawMaze() {
  const mazeDiv = document.getElementById('maze');
  mazeDiv.innerHTML = '';

  console.log('Bắt đầu vẽ mê cung với data:', mazeData);

  if (mazeData.hWalls && mazeData.vWalls && mazeData.cells) {
    // Format mới: Line-based
    console.log('Sử dụng format mới (line-based với đường kẻ)');
    const ROWS = mazeData.cells.length;
    const COLS = mazeData.cells[0].length;
    
    const availableWidth = window.innerWidth * 0.85 / (COLS + 1);
    const availableHeight = window.innerHeight * 0.7 / (ROWS + 1);
    const cellSize = Math.min(availableWidth, availableHeight, 25);
    console.log('Cell size tính được:', cellSize, 'ROWS:', ROWS, 'COLS:', COLS);

    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'column';
    gridContainer.style.lineHeight = '0';

    for (let i = 0; i <= ROWS; i++) {
      const hWallRow = document.createElement('div');
      hWallRow.style.display = 'flex';
      hWallRow.style.height = '1px';
      hWallRow.style.lineHeight = '0';
      hWallRow.style.background = 'transparent';
      for (let j = 0; j < COLS; j++) {
        const seg = document.createElement('div');
        seg.style.width = `${cellSize}px`;
        seg.style.height = '100%';
        if (mazeData.hWalls[i][j]) {
          seg.style.background = '#333';
        } else {
          seg.style.background = '#ccc';
        }
        seg.style.borderRadius = '0';
        hWallRow.appendChild(seg);
      }
      gridContainer.appendChild(hWallRow);

      if (i < ROWS) {
        const cellRow = document.createElement('div');
        cellRow.style.display = 'flex';
        cellRow.style.height = `${cellSize}px`;
        cellRow.style.lineHeight = '0';
        for (let j = 0; j < COLS; j++) {
          const vWall = document.createElement('div');
          vWall.style.width = '1px';
          vWall.style.height = `${cellSize}px`;
          if (mazeData.vWalls[i][j]) {
            vWall.style.background = '#333';
          } else {
            vWall.style.background = '#ccc';
          }
          vWall.style.borderRadius = '0';
          cellRow.appendChild(vWall);

          const cell = document.createElement('div');
          cell.className = 'cell path';
          cell.style.width = `${cellSize}px`;
          cell.style.height = `${cellSize}px`;
          cell.style.border = 'none';
          const val = mazeData.cells[i][j];
          
          if (val === 2) {
            cell.classList.add('player');
          } else if (val === 3) {
            // 🎯 ĐÍCH MÀU ĐỎ NỔI BẬT (giống C++: RGB(255, 0, 0))
            cell.classList.add('goal');
            cell.style.background = '#FF0000'; // Đỏ thuần
            cell.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)'; // Hiệu ứng phát sáng mạnh hơn
          } else if (val === 4) {
            // Visited cells (xanh lá nhạt giống C++: RGB(0, 200, 0))
            cell.classList.add('visited');
            cell.style.background = '#00C800';
          } else if (val === 5 || (pathFound && persistentPath.some(p => p.x === i && p.y === j))) {
            // ✅ Path found - GIỮ ĐƯỜNG ĐI SAU KHI TÌM THẤY
            cell.classList.add('pathfound');
            cell.style.background = '#FF0000'; // Đỏ cho đường đi (giống C++)
          }
          cellRow.appendChild(cell);
        }
        const lastVWall = document.createElement('div');
        lastVWall.style.width = '1px';
        lastVWall.style.height = `${cellSize}px`;
        if (mazeData.vWalls[i][COLS]) {
          lastVWall.style.background = '#333';
        } else {
          lastVWall.style.background = '#ccc';
        }
        lastVWall.style.borderRadius = '0';
        cellRow.appendChild(lastVWall);
        gridContainer.appendChild(cellRow);
      }
    }

    mazeDiv.appendChild(gridContainer);
    mazeDiv.style.width = `${(COLS + 1) * cellSize}px`;
    mazeDiv.style.height = `${(ROWS + 1) * cellSize}px`;
    console.log('Vẽ mê cung line-based thành công');
  } else if (Array.isArray(mazeData) && mazeData.length > 0 && Array.isArray(mazeData[0])) {
    // Format cũ: Cell-based
    console.log('Sử dụng format cũ (cell-based)');
    const ROWS = mazeData.length;
    const COLS = mazeData[0].length;
    const cellSize = Math.min(window.innerWidth * 0.85 / COLS, window.innerHeight * 0.7 / ROWS, 25);
    
    mazeData.forEach((row, rowIndex) => {
      const r = document.createElement('div');
      r.style.display = 'flex';
      r.style.lineHeight = '0';
      row.forEach((c, colIndex) => {
        const d = document.createElement('div');
        d.className = 'cell';
        d.style.width = `${cellSize}px`;
        d.style.height = `${cellSize}px`;
        d.style.border = '1px solid #ccc';
        if (c === 1) {
          d.style.background = '#222';
          d.style.border = '2px solid #333';
        }
        if (c === 0) d.classList.add('path');
        if (c === 2) d.classList.add('player');
        if (c === 3) {
          // 🎯 ĐÍCH MÀU ĐỎ NỔI BẬT
          d.classList.add('goal');
          d.style.background = '#FF0000'; // Đỏ thuần
          d.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)';
          d.style.border = '2px solid #CC0000';
        }
        if (c === 4) {
          d.classList.add('visited');
          d.style.background = '#00C800'; // Xanh lá giống C++
        }
        if (c === 5 || (pathFound && persistentPath.some(p => p.x === rowIndex && p.y === colIndex))) {
          // ✅ Path found
          d.classList.add('pathfound');
          d.style.background = '#FF0000'; // Đỏ cho đường đi
          d.style.border = '2px solid #CC0000';
        }
        r.appendChild(d);
      });
      mazeDiv.appendChild(r);
    });
    mazeDiv.style.width = `${COLS * cellSize}px`;
    mazeDiv.style.height = `${ROWS * cellSize}px`;
    console.log('Vẽ mê cung cell-based thành công');
  } else {
    console.error('Dữ liệu mê cung không hợp lệ:', mazeData);
    const testGrid = Array.from({length: 10}, () => Array(10).fill(0));
    testGrid[9][0] = 2;
    testGrid[0][9] = 3;
    mazeData = testGrid;
    drawMaze();
    alert('Dữ liệu mê cung không đúng định dạng. Vẽ grid test để debug. Kiểm tra console.');
  }
}

function handleKey(e) {
  if (mazeContainer.style.display !== 'block' || runningAlgo || pathFound) return; // ✅ Không cho di chuyển khi algo đã tìm thấy đường
  let dir;
  if (e.key === 'w' || e.key === 'ArrowUp') dir = 'UP';
  else if (e.key === 's' || e.key === 'ArrowDown') dir = 'DOWN';
  else if (e.key === 'a' || e.key === 'ArrowLeft') dir = 'LEFT';
  else if (e.key === 'd' || e.key === 'ArrowRight') dir = 'RIGHT';
  else if (e.key === 'Escape') { resetGame(); return; }

  if (dir) {
    fetch(`${SERVER_URL}/playerMove?dir=${dir}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        mazeData = data;
        playerSteps++;
        playerNodes++;
        updatePlayerPos();
        drawMaze();
        updatePlayerMetrics();
        checkWin();
      })
      .catch(err => console.error('Lỗi di chuyển:', err));
  }
}

// ✅ THUẬT TOÁN DỪNG NGAY KHI TÌM THẤY ĐƯỜNG (giống C++ finishAlgo())
function runAlgo(endpoint) {
  if (runningAlgo) return;
  runningAlgo = true;
  algoStartTime = Date.now();
  nodeExpanded = 0;
  pathLength = 0;
  persistentPath = [];
  pathFound = false; // Reset flag
  algoMetrics.style.display = 'block';
  
  console.log('🚀 Bắt đầu chạy thuật toán:', endpoint);
  
  algoInterval = setInterval(() => {
    fetch(`${SERVER_URL}${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('📦 Server trả về:', data); // ✅ LOG DEBUG
        console.log('📍 Goal position:', goalX, goalY); // ✅ LOG DEBUG
        
        mazeData = data;
        nodeExpanded += data.expanded || 1;
        
        // ✅ KIỂM TRA GOAL VALUE (HỖ TRỢ CẢ 2 FORMAT)
        let goalValue = null;
        
        // Format mới: data.cells
        if (data.cells && data.cells[goalX]) {
          goalValue = data.cells[goalX][goalY];
        }
        // Format cũ: Array trực tiếp (SERVER CỦA BẠN DÙNG FORMAT NÀY!)
        else if (Array.isArray(data) && data[goalX]) {
          goalValue = data[goalX][goalY];
        }
        
        console.log('📍 Goal cell value:', goalValue); // ✅ LOG DEBUG
        
        // ✅ NẾU GOAL = 5 (PATH CELL) → ĐÃ TÌM THẤY ĐƯỜNG!
        if (goalValue === 5) {
          console.log('🎉🎉🎉 TÌM THẤY ĐƯỜNG! DỪNG THUẬT TOÁN! 🎉🎉🎉');
          
          pathLength = data.pathLen || calculatePathLength();
          pathFound = true;
          
          // Lưu đường đi vĩnh viễn
          if (data.path && Array.isArray(data.path)) {
            persistentPath = data.path.map(p => typeof p === 'object' ? p : {x: p[0], y: p[1]});
          }
          
          console.log('📊 Path length:', pathLength, 'Nodes expanded:', nodeExpanded);
          
          stopAlgo(); // ✅ DỪNG NGAY
          drawMaze(); // Vẽ lại với đường đi cuối cùng
          updateAlgoMetrics();
          return; // ✅ THOÁT
        }
        
        // Tiếp tục vẽ nếu chưa tìm thấy
        drawMaze();
        updateAlgoMetrics();
      })
      .catch(err => {
        console.error('❌ Lỗi algo:', err);
        stopAlgo();
      });
  }, 40);
}
// Hàm tính path length từ goal về start (giống C++)
function calculatePathLength() {
  let len = 0;
  if (!mazeData.cells) return 0;
  
  // Tìm goal cell
  let goalCell = null;
  for (let i = 0; i < mazeData.cells.length; i++) {
    for (let j = 0; j < mazeData.cells[0].length; j++) {
      if (mazeData.cells[i][j] === 3 || (i === goalX && j === goalY)) {
        goalCell = {x: i, y: j};
        break;
      }
    }
    if (goalCell) break;
  }
  
  if (!goalCell) return 0;
  
  // Đếm số ô có path (value = 5) từ goal về start
  for (let i = 0; i < mazeData.cells.length; i++) {
    for (let j = 0; j < mazeData.cells[0].length; j++) {
      if (mazeData.cells[i][j] === 5) len++;
    }
  }
  
  return len;
}

function stopAlgo() {
  runningAlgo = false;
  if (algoInterval) {
    clearInterval(algoInterval);
    algoInterval = null;
  }
  console.log('⏹️ Thuật toán đã dừng');
}

function fetchMaze(endpoint) {
  fetch(`${SERVER_URL}${endpoint}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      mazeData = data;
      drawMaze();
      stopAlgo();
      resetPlayerMetrics();
      updatePlayerPos();
      updateGoalPos();
    });
}

function resetGame() {
  persistentPath = [];
  pathFound = false;
  stopAlgo();
  fetchMaze('/reset');
  successMessage.style.opacity = '0';
  algoMetrics.style.display = 'none';
  console.log('🔄 Game reset');
}

function checkWin() {
  if (playerX === goalX && playerY === goalY) {
    if (playerTimer) clearInterval(playerTimer);
    successMessage.style.opacity = '1';
    console.log('🎉 Player won!');
  }
}

function resetPlayerMetrics() {
  playerStartTime = Date.now();
  playerSteps = 0;
  playerNodes = 1;
  if (playerTimer) clearInterval(playerTimer);
  playerTimer = setInterval(updatePlayerMetrics, 1000);
  updatePlayerMetrics();
}

function updatePlayerMetrics() {
  const elapsed = Math.floor((Date.now() - playerStartTime) / 1000);
  timeSpan.textContent = elapsed;
  stepsSpan.textContent = playerSteps;
  nodesSpan.textContent = playerNodes;
}

function updateAlgoMetrics() {
  const algoElapsed = Math.floor((Date.now() - algoStartTime) / 1000);
  algoTimeSpan.textContent = algoElapsed;
  pathLenSpan.textContent = pathLength;
  expandedSpan.textContent = nodeExpanded;
}

window.addEventListener('resize', () => {
  if (mazeContainer.style.display === 'block') {
    drawMaze();
  }
});

// Init
hideAllSections();
welcome.style.display = 'flex';
let playerTimer;