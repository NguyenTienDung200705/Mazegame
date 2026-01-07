// controller/MazeController.js
import * as M from "../model/MazeModel.js";
import { drawMaze } from "../view/MazeView.js";
import { api } from "../api/mazeApi.js";

// ===== DOM =====
const readyBtn = document.getElementById('readyBtn');
const welcome = document.getElementById('welcome');
const modeSelection = document.getElementById('modeSelection');
const difficultySelection = document.getElementById('difficultySelection');
const mazeContainer = document.getElementById('mazeContainer');
const successMessage = document.getElementById('successMessage');
const algoMetrics = document.getElementById('algoMetrics');

// ===== UI FLOW =====
function hideAllSections() {
  [welcome, modeSelection, difficultySelection, mazeContainer]
    .forEach(s => s.style.display = 'none');
}

readyBtn.onclick = () => {
  hideAllSections();
  modeSelection.style.display = 'flex';
};

document.getElementById('randomBtn').onclick = () => startGame(25);
document.getElementById('levelBtn').onclick = () => {
  hideAllSections();
  difficultySelection.style.display = 'flex';
};

difficultySelection.querySelectorAll('button[data-diff]')
  .forEach(btn => {
    btn.onclick = () => startGame(parseInt(btn.dataset.diff));
  });

// ===== GAME =====
function startGame(diff) {
  M.currentDifficulty = diff;
  M.persistentPath = [];
  M.pathFound = false;

  if (M.algoInterval) clearInterval(M.algoInterval);
  M.runningAlgo = false;

  api.generateMaze(diff).then(data => {
    M.mazeData = data;
    updatePlayerPos();
    updateGoalPos();
    drawMaze();

    hideAllSections();
    mazeContainer.style.display = 'block';
    resetPlayerMetrics();
    successMessage.style.opacity = '0';

    document.removeEventListener('keydown', handleKey);
    document.addEventListener('keydown', handleKey);
  });
}

function updatePlayerPos() {
  M.mazeData.cells?.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell === 2) { M.playerX = i; M.playerY = j; }
    })
  );
}

function updateGoalPos() {
  M.mazeData.cells?.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell === 3) { M.goalX = i; M.goalY = j; }
    })
  );
}

function handleKey(e) {
  if (M.runningAlgo || M.pathFound) return;

  const map = {
    w: 'UP', ArrowUp: 'UP',
    s: 'DOWN', ArrowDown: 'DOWN',
    a: 'LEFT', ArrowLeft: 'LEFT',
    d: 'RIGHT', ArrowRight: 'RIGHT'
  };

  const dir = map[e.key];
  if (!dir) return;

  api.playerMove(dir).then(data => {
    M.mazeData = data;
    M.playerSteps++;
    M.playerNodes++;
    updatePlayerPos();
    drawMaze();
    checkWin();
  });
}

// ===== ALGO =====
function runAlgo(endpoint) {
  if (M.runningAlgo) return;
  M.runningAlgo = true;
  M.algoStartTime = Date.now();
  M.nodeExpanded = 0;
  M.pathFound = false;

  M.algoInterval = setInterval(() => {
    api.stepAlgo(endpoint).then(data => {
      M.mazeData = data;
      drawMaze();
    });
  }, 40);
}

// expose cho HTML
window.runAlgo = runAlgo;
window.startGame = startGame;

// ===== INIT =====
hideAllSections();
welcome.style.display = 'flex';
