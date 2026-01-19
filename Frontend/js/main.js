// main.js (hoàn chỉnh - fixed + hỗ trợ chạy nhiều thuật toán liên tiếp, reset state, fix DOM query & param mismatches)
// FIXED v8.3: Add resetPositions import; fix wrappedStartGame & wrappedHandleKey params (remove runningAlgo); safe reset in button/ESC (use resetPositions + wrappedResetGame); robust diff parse
import { hideAllSections } from './utils.js';
import { setupNavigation } from './navigation.js';
import { startGame, updatePlayerPos, updateGoalPos, drawMaze, handleKey, mazeData, playerX, playerY, goalX, goalY, currentDifficulty, persistentPath, pathFound, setSelectionMode, resetPositions } from './game.js';  // FIXED: + resetPositions
import { runAlgo, stopAlgo, fetchMaze, runningAlgo, algoInterval, algoStartTime, pathLength, nodeExpanded } from './algo.js';
import { resetPlayerMetrics, updatePlayerMetrics, updateAlgoMetrics } from './metrics.js';
import { checkWin, resetGame } from './utils.js';

// DOM Elements (sẽ init trong DOMContentLoaded)
let SERVER_URL = 'http://localhost:8080';
let readyBtn, welcome, modeSelection, difficultySelection, mazeContainer, mazeDiv, successMessage;
let timeSpan, stepsSpan, nodesSpan, algoTimeSpan, pathLenSpan, expandedSpan, algoMetrics;
let backToWelcome, backToMode;
let selectionStatus;  // For status div

// Variables toàn cục
let playerStartTime = Date.now();
let playerSteps = 0;
let playerNodes = 1;
let playerTimer;

// Wrapper functions để simplify params
function wrappedStartGame(diff) {
  startGame(
    diff,
    algoInterval,  // FIXED: Remove runningAlgo param (handled globally in game.js)
    wrappedResetPlayerMetrics,
    updatePlayerPos,
    updateGoalPos,
    wrappedDrawMaze,
    wrappedHideAllSections,
    mazeContainer,
    successMessage,
    wrappedHandleKey
  );
}

function wrappedResetPlayerMetrics() {
  resetPlayerMetrics(playerStartTime, playerSteps, playerNodes, playerTimer, wrappedUpdatePlayerMetrics, timeSpan, stepsSpan, nodesSpan);
}

function wrappedUpdatePlayerMetrics() {
  updatePlayerMetrics(timeSpan, stepsSpan, nodesSpan, playerStartTime, playerSteps, playerNodes);
}

function wrappedDrawMaze(data, pf, pp, mode = null) {
  drawMaze(data, pf, pp, mode);
}

function wrappedHideAllSections() {
  hideAllSections([welcome, modeSelection, difficultySelection, mazeContainer]);
}

function wrappedHandleKey(e) {
  handleKey(e, mazeContainer, algoInterval, pathFound, playerSteps, playerNodes, updatePlayerPos, wrappedDrawMaze, wrappedUpdatePlayerMetrics, playerTimer, successMessage);  // FIXED: Remove runningAlgo param (use global in game.js)
}

function wrappedCheckWin() {
  checkWin(playerX, playerY, goalX, goalY, playerTimer, successMessage);
}

function wrappedUpdateAlgoMetrics(time, len, expanded) {
  updateAlgoMetrics(algoTimeSpan, pathLenSpan, expandedSpan, algoStartTime, len, expanded);
}

function wrappedResetGame() {
  resetGame(persistentPath, pathFound, stopAlgo, fetchMaze, successMessage, algoMetrics);
}

// Update selection status div
function updateSelectionStatus() {
  if (!selectionStatus) return;
  let status = 'Chưa chọn điểm nào.';
  if (playerX !== 0 && playerY !== 0 && goalX !== 0 && goalY !== 0) {
    status = `Đã chọn: Bắt đầu (${playerX}, ${playerY}) | Kết thúc (${goalX}, ${goalY})`;
  } else if (playerX !== 0 && playerY !== 0) {
    status = `Đã chọn bắt đầu (${playerX}, ${playerY}). Chưa chọn kết thúc.`;
  } else if (goalX !== 0 && goalY !== 0) {
    status = `Đã chọn kết thúc (${goalX}, ${goalY}). Chưa chọn bắt đầu.`;
  }
  selectionStatus.textContent = status;
}

// FIXED: Async runSafeAlgo với reset state và disable/enable buttons (param match runAlgo)
const runSafeAlgo = async (endpoint, btn) => {
  if (playerX === 0 || playerY === 0) {
    alert('Vui lòng chọn điểm bắt đầu trước!');
    return;
  }
  if (goalX === 0 || goalY === 0) {
    alert('Vui lòng chọn điểm kết thúc trước!');
    return;
  }

  // FIXED: Disable all algo buttons during run
  const algoBtns = [dfsBtn, bfsBtn, astarBtn].filter(b => b);  // Filter null
  algoBtns.forEach(b => b.disabled = true);
  if (btn) btn.textContent = 'Running...';  // Specific button

  console.log(`🚀 Running ${endpoint} with start: (${playerX}, ${playerY}), goal: (${goalX}, ${goalY})`);

  try {
    // FIXED: Param match runAlgo (no pathFound, use wrappedUpdateAlgoMetrics)
    await runAlgo(endpoint, goalX, goalY, mazeData, persistentPath, stopAlgo, wrappedUpdateAlgoMetrics, algoMetrics);
  } catch (err) {
    console.error('❌ Algo error:', err);
  } finally {
    // FIXED: Re-enable buttons sau khi dừng (dù success hay error)
    algoBtns.forEach(b => {
      b.disabled = false;
      b.textContent = b.id.replace('Btn', '');  // e.g., 'dfs' from 'dfsBtn'
    });
    updateSelectionStatus();  // Refresh status
    console.log('✅ Algo complete, buttons re-enabled.');
  }
};

// Main setup (chờ DOM load)
document.addEventListener('DOMContentLoaded', () => {
  // FIXED: Query DOM elements an toàn (check null)
  readyBtn = document.getElementById('readyBtn');
  welcome = document.getElementById('welcome');
  modeSelection = document.getElementById('modeSelection');
  difficultySelection = document.getElementById('difficultySelection');
  mazeContainer = document.getElementById('mazeContainer');
  mazeDiv = document.getElementById('maze');
  successMessage = document.getElementById('successMessage');
  timeSpan = document.getElementById('time');
  stepsSpan = document.getElementById('steps');
  nodesSpan = document.getElementById('nodes');
  algoTimeSpan = document.getElementById('algoTime');
  pathLenSpan = document.getElementById('pathLen');
  expandedSpan = document.getElementById('expanded');
  algoMetrics = document.getElementById('algoMetrics');
  backToWelcome = document.getElementById('backToWelcome');
  backToMode = document.getElementById('backToMode');
  selectionStatus = document.getElementById('selection-status');

  // FIXED: Debug DOM missing
  if (!readyBtn) console.error('❌ readyBtn not found! Check HTML ID.');
  if (!algoMetrics) console.error('❌ #algoMetrics not found! Check HTML.');
  else console.log('DOM loaded OK!');

  // Setup Navigation
  if (readyBtn && welcome && modeSelection && difficultySelection && mazeContainer && backToWelcome && backToMode) {
    setupNavigation(
      welcome, modeSelection, difficultySelection, mazeContainer, 
      backToWelcome, backToMode, readyBtn, 
      document.getElementById('randomBtn'), 
      document.getElementById('levelBtn'),
      wrappedStartGame
    );
  }

  // Selection Buttons
  const btnSelectStart = document.getElementById('btn-select-start');
  const btnSelectGoal = document.getElementById('btn-select-goal');
  
  if (btnSelectStart) {
    btnSelectStart.addEventListener('click', () => {
      setSelectionMode('start');
      console.log('🔵 Button "Chọn Start" clicked – mode activated!');
    });
  }
  
  if (btnSelectGoal) {
    btnSelectGoal.addEventListener('click', () => {
      setSelectionMode('goal');
      console.log('🔴 Button "Chọn Goal" clicked – mode activated!');
    });
  }

  // Status poll với MutationObserver
  let statusInterval;
  const checkStatus = () => {
    updateSelectionStatus();
    if (playerX !== 0 && goalX !== 0) {
      clearInterval(statusInterval);
    }
  };
  if (mazeContainer) {
    const observer = new MutationObserver(() => {
      if (mazeContainer.style.display === 'block' && !statusInterval) {
        statusInterval = setInterval(checkStatus, 500);
        checkStatus();
      }
    });
    observer.observe(mazeContainer, { attributes: true, attributeFilter: ['style'] });
  }

  // FIXED: Algo Buttons với runSafeAlgo (check null)
  const dfsBtn = document.getElementById('dfsBtn');
  const bfsBtn = document.getElementById('bfsBtn');
  const astarBtn = document.getElementById('astarBtn');
  
  if (dfsBtn) dfsBtn.addEventListener('click', () => runSafeAlgo('/stepDFS', dfsBtn));
  if (bfsBtn) bfsBtn.addEventListener('click', () => runSafeAlgo('/stepBFS', bfsBtn));
  if (astarBtn) astarBtn.addEventListener('click', () => runSafeAlgo('/stepAStar', astarBtn));

  // FIXED: Reset Button (robust diff + resetPositions to avoid const assignment error)
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      let diffInput = prompt('Chọn mức độ (10=dễ, 25=trung bình, 40=khó):') || (typeof currentDifficulty !== 'undefined' ? currentDifficulty : 25);
      const diff = parseInt(diffInput);
      if (isNaN(diff) || diff < 10 || diff > 40) {
        alert('Mức độ không hợp lệ! Mặc định dùng 25.');
        return;
      }

      // FIXED: Use resetPositions() instead of direct assignment (avoids const error if any)
      resetPositions();
      wrappedResetGame();  // Full reset (path, algo, etc.)
      updateSelectionStatus();

      wrappedStartGame(diff);
      
      console.log(`🔄 Reset game với độ khó: ${diff}`);
    });
  }

  // Handle Key
  document.addEventListener('keydown', wrappedHandleKey);

  // FIXED: ESC to reset (add resetPositions + wrappedResetGame + robust diff)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      let diffInput = prompt('Reset với mức độ nào? (10/25/40):') || (typeof currentDifficulty !== 'undefined' ? currentDifficulty : 25);
      const diff = parseInt(diffInput);
      if (isNaN(diff) || diff < 10 || diff > 40) {
        alert('Mức độ không hợp lệ! Mặc định dùng 25.');
        return;
      }

      resetPositions();
      wrappedResetGame();
      updateSelectionStatus();
      wrappedStartGame(diff);
    }
  });

  // Window resize
  window.addEventListener('resize', () => {
    if (mazeContainer && mazeContainer.style.display === 'block') {
      wrappedDrawMaze(mazeData, pathFound, persistentPath);
    }
  });

  // Init UI
  if (welcome) wrappedHideAllSections();
  if (welcome) welcome.style.display = 'flex';
  playerTimer = null;
  console.log('Game initialized! Test nút readyBtn...');
  updateSelectionStatus();
});

// Expose wrappedStartGame
export { wrappedStartGame };