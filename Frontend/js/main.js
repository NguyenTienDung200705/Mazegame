// main.js (hoàn chỉnh - fixed)
import { hideAllSections } from './utils.js';
import { setupNavigation } from './navigation.js';
import { startGame, updatePlayerPos, updateGoalPos, drawMaze, handleKey, mazeData, playerX, playerY, goalX, goalY, currentDifficulty, persistentPath, pathFound } from './game.js';
import { runAlgo, stopAlgo, fetchMaze, runningAlgo, algoInterval, algoStartTime, pathLength, nodeExpanded } from './algo.js';
import { resetPlayerMetrics, updatePlayerMetrics, updateAlgoMetrics } from './metrics.js';
import { checkWin, resetGame } from './utils.js';

// DOM Elements (sẽ init trong DOMContentLoaded)
let SERVER_URL = 'http://localhost:8080';
let readyBtn, welcome, modeSelection, difficultySelection, mazeContainer, mazeDiv, successMessage;
let timeSpan, stepsSpan, nodesSpan, algoTimeSpan, pathLenSpan, expandedSpan, algoMetrics;
let backToWelcome, backToMode;

// Variables toàn cục (KHÔNG duplicate - dùng imported)
let playerStartTime = Date.now();
let playerSteps = 0;
let playerNodes = 1;
let playerTimer;

// Wrapper functions để simplify params (gọi từ navigation/events)
function wrappedStartGame(diff) {
  startGame(
    diff,
    runningAlgo,  // Imported từ algo.js
    algoInterval, // Imported
    wrappedResetPlayerMetrics, // Wrapper
    updatePlayerPos,
    updateGoalPos,
    wrappedDrawMaze, // Wrapper
    wrappedHideAllSections, // Wrapper
    mazeContainer,
    successMessage,
    wrappedHandleKey // Wrapper
  );
}

function wrappedResetPlayerMetrics() {
  resetPlayerMetrics(playerStartTime, playerSteps, playerNodes, playerTimer, wrappedUpdatePlayerMetrics, timeSpan, stepsSpan, nodesSpan);
}

function wrappedUpdatePlayerMetrics() {
  updatePlayerMetrics(timeSpan, stepsSpan, nodesSpan, playerStartTime, playerSteps, playerNodes);
}

function wrappedDrawMaze(data, pf, pp) {
  drawMaze(data, pf, pp);
}

function wrappedHideAllSections() {
  hideAllSections([welcome, modeSelection, difficultySelection, mazeContainer]);
}

function wrappedHandleKey(e) {
  handleKey(e, mazeContainer, runningAlgo, pathFound, playerSteps, playerNodes, updatePlayerPos, drawMaze, wrappedUpdatePlayerMetrics, wrappedCheckWin, SERVER_URL);
}

function wrappedCheckWin() {
  checkWin(playerX, playerY, goalX, goalY, playerTimer, successMessage);
}

function wrappedUpdateAlgoMetrics() {
  updateAlgoMetrics(algoTimeSpan, pathLenSpan, expandedSpan, algoStartTime, pathLength, nodeExpanded);
}

function wrappedResetGame() {
  resetGame(persistentPath, pathFound, stopAlgo, fetchMaze, successMessage, algoMetrics);
}

// Main setup (chờ DOM load)
document.addEventListener('DOMContentLoaded', () => {
  // Init DOM elements
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

  // Kiểm tra DOM tồn tại (debug)
  if (!readyBtn) console.error('readyBtn not found!');
  else console.log('DOM loaded OK!');

  // Setup Navigation (pass DOM)
  setupNavigation(
  welcome, modeSelection, difficultySelection, mazeContainer, 
  backToWelcome, backToMode, readyBtn, 
  document.getElementById('randomBtn'), 
  document.getElementById('levelBtn'),
  wrappedStartGame  // ← Thêm param này
);
  // Algo Buttons (dùng addEventListener)
  const dfsBtn = document.getElementById('dfsBtn');
  const bfsBtn = document.getElementById('bfsBtn');
  const astarBtn = document.getElementById('astarBtn');
  if (dfsBtn) dfsBtn.addEventListener('click', () => runAlgo('/stepDFS', goalX, goalY, mazeData, persistentPath, pathFound, stopAlgo, wrappedUpdateAlgoMetrics, algoMetrics));
  if (bfsBtn) bfsBtn.addEventListener('click', () => runAlgo('/stepBFS', goalX, goalY, mazeData, persistentPath, pathFound, stopAlgo, wrappedUpdateAlgoMetrics, algoMetrics));
  if (astarBtn) astarBtn.addEventListener('click', () => runAlgo('/stepAStar', goalX, goalY, mazeData, persistentPath, pathFound, stopAlgo, wrappedUpdateAlgoMetrics, algoMetrics));

  // Reset Button
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const diff = prompt('Chọn mức độ (10=dễ, 25=trung bình, 40=khó):') || currentDifficulty;
      wrappedStartGame(parseInt(diff));
    });
  }

  // Handle Key (attach global)
  document.addEventListener('keydown', wrappedHandleKey);

  // Window resize
  window.addEventListener('resize', () => {
    if (mazeContainer && mazeContainer.style.display === 'block') {
      wrappedDrawMaze(mazeData, pathFound, persistentPath);
    }
  });

  // Init UI
  wrappedHideAllSections();
  welcome.style.display = 'flex';
  playerTimer = null;
  console.log('Game initialized! Test nút readyBtn...');
});

// Expose wrappedStartGame cho navigation.js (nếu cần import)
export { wrappedStartGame };