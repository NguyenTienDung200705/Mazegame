// model/MazeModel.js
export const SERVER_URL = 'http://localhost:8080';

export let mazeData = {};
export let playerX = 0, playerY = 0;
export let goalX = 0, goalY = 0;
export let playerStartTime = Date.now();
export let playerSteps = 0;
export let playerNodes = 1;
export let runningAlgo = false;
export let algoInterval = null;
export let algoStartTime = 0;
export let pathLength = 0;
export let nodeExpanded = 0;
export let currentDifficulty = 25;
export let persistentPath = [];
export let pathFound = false;
export let playerTimer = null;
