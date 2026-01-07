// algo.js (fixed - tránh chạy liên tục)
import { updateAlgoMetrics } from './metrics.js';
import { drawMaze } from './game.js';

const SERVER_URL = 'http://localhost:8080';

export let runningAlgo = false;
export let algoInterval;
export let algoStartTime;
export let pathLength = 0;
export let nodeExpanded = 0;

export function runAlgo(endpoint, goalX, goalY, mazeData, persistentPath, pathFound, stopAlgo, updateAlgoMetrics, algoMetrics) {
  if (runningAlgo) {
    console.warn('🚫 Algo đang chạy, bỏ qua!'); // Debug: Ngăn multiple runs
    return;
  }
  runningAlgo = true;
  algoStartTime = Date.now();
  nodeExpanded = 0;
  pathLength = 0;
  persistentPath = [];
  pathFound = false;
  algoMetrics.style.display = 'block';
  
  console.log('🚀 Bắt đầu chạy thuật toán:', endpoint);
  
  // ✅ THÊM TIMEOUT AN TOÀN: Dừng sau 30s nếu không tìm thấy path
  const timeoutId = setTimeout(() => {
    console.warn('⏰ Timeout: Dừng algo vì quá lâu!');
    stopAlgo();
  }, 30000); // 30 giây
  
  algoInterval = setInterval(() => {
    fetch(`${SERVER_URL}${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('📦 Server trả về:', data);
        console.log('📍 Goal position:', goalX, goalY);
        
        mazeData = data;
        nodeExpanded += data.expanded || 1;
        
        let goalValue = null;
        
        if (data.cells && data.cells[goalX]) {
          goalValue = data.cells[goalX][goalY];
        }
        else if (Array.isArray(data) && data[goalX]) {
          goalValue = data[goalX][goalY];
        }
        
        console.log('📍 Goal cell value:', goalValue); // Debug: Xem value có =5 không
        
        if (goalValue === 5) {
          console.log('🎉🎉🎉 TÌM THẤY ĐƯỜNG! DỪNG THUẬT TOÁN! 🎉🎉🎉');
          
          pathLength = data.pathLen || calculatePathLength(mazeData);
          pathFound = true;
          
          if (data.path && Array.isArray(data.path)) {
            persistentPath = data.path.map(p => typeof p === 'object' ? p : {x: p[0], y: p[1]});
          }
          
          console.log('📊 Path length:', pathLength, 'Nodes expanded:', nodeExpanded);
          
          clearTimeout(timeoutId); // Clear timeout nếu tìm thấy
          stopAlgo(); // Dừng interval
          drawMaze(mazeData, pathFound, persistentPath);
          updateAlgoMetrics(/* params */);
          return; // Thoát interval
        }
        
        // Vẽ và update nếu chưa tìm thấy
        drawMaze(mazeData, pathFound, persistentPath);
        updateAlgoMetrics(/* params */);
      })
      .catch(err => {
        console.error('❌ Lỗi algo:', err);
        clearTimeout(timeoutId); // Clear timeout nếu lỗi
        stopAlgo();
      });
  }, 40); // Giữ 40ms cho animation mượt
}

export function calculatePathLength(mazeData) {
  let len = 0;
  if (!mazeData.cells) return 0;
  
  for (let i = 0; i < mazeData.cells.length; i++) {
    for (let j = 0; j < mazeData.cells[0].length; j++) {
      if (mazeData.cells[i][j] === 5) len++;
    }
  }
  
  return len;
}

export function stopAlgo() {
  runningAlgo = false;
  if (algoInterval) {
    clearInterval(algoInterval);
    algoInterval = null;
    console.log('⏹️ Interval cleared thành công!'); // Debug: Xác nhận clear
  }
  console.log('⏹️ Thuật toán đã dừng');
}

export function fetchMaze(endpoint, mazeData, drawMaze, stopAlgo, resetPlayerMetrics, updatePlayerPos, updateGoalPos) {
  fetch(`${SERVER_URL}${endpoint}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      mazeData = data;
      drawMaze(mazeData, /* pathFound */ /* persistentPath */);
      stopAlgo(/* algoInterval */);
      resetPlayerMetrics(/* params */);
      updatePlayerPos(mazeData);
      updateGoalPos(mazeData);
    });
}