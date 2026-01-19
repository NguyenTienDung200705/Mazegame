// algo.js (fixed v6.0 - direct import/call updateAlgoMetrics, ignore passed fn, ticks compat)
import { updateAlgoMetrics } from './metrics.js';
import { drawMaze } from './game.js';

const SERVER_URL = 'http://localhost:8080';

export let runningAlgo = false;
export let algoInterval;
export let algoStartTime = null;  // Deprecated
export let pathLength = 0;
export let nodeExpanded = 0;
export let frozenAlgoTime = 0;  // Deprecated
export let frozenNodeExpanded = 0;
export let pathFound = false;

let perfStart = null;
let tickCounter = 0;

export async function runAlgo(endpoint, goalX, goalY, mazeData, persistentPath, stopAlgo, updateAlgoMetricsFn, algoMetrics) {  // Giữ param compat, nhưng ignore updateAlgoMetricsFn
  console.log('🔍 runAlgo called with endpoint:', endpoint, 'goal:', goalX, goalY);

  // Reset server state
  try {
    console.log('🔄 Fetching reset...');
    const resetRes = await fetch(`${SERVER_URL}/resetAlgoState`);
    if (resetRes.ok) {
      const resetData = await resetRes.json();
      mazeData = resetData;
      drawMaze(mazeData, false, [], null);
      console.log('✅ Server reset OK.');
    } else {
      console.warn('⚠️ Reset failed (status:', resetRes.status, '), continuing...');
    }
  } catch (err) {
    console.error('❌ Reset fetch error:', err);
  }

  if (goalX === 0 && goalY === 0) {
    alert('Vui lòng chọn điểm kết thúc trước!');
    return;
  }

  if (runningAlgo) {
    console.warn('🚫 Algo đang chạy!');
    return;
  }

  // Reset & set perfStart
  runningAlgo = true;
  perfStart = performance.now();
  frozenAlgoTime = 0;
  frozenNodeExpanded = 0;
  nodeExpanded = 0;
  pathLength = 0;
  persistentPath = [];
  pathFound = false;
  tickCounter = 0;
  if (algoMetrics && algoMetrics.style) algoMetrics.style.display = 'block';
  
  console.log('🚀 Algo started - perfStart:', perfStart.toFixed(0), 'ms');
  
  let timeoutId = setTimeout(() => {
    console.warn('⏰ Timeout 50s triggered!');
    stopAlgo();
  }, 50000);

  algoInterval = setInterval(() => {
    tickCounter++;
    if (pathFound) {
      console.log(`✅ Skipping tick #${tickCounter} (path found).`);
      clearTimeout(timeoutId);
      stopAlgo();
      return;
    }

    const nowPerf = performance.now();
    const elapsedMs = nowPerf - perfStart;
    const currentSeconds = Math.floor(elapsedMs / 1000);
    console.log(`🔄 Tick #${tickCounter} | Elapsed: ${elapsedMs.toFixed(0)}ms (${currentSeconds}s) | perfStart valid: ${perfStart !== null}`);

    fetch(`${SERVER_URL}${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('📦 Data flags:', { pathFound: data.pathFound, running: data.running, pathLen: data.pathLen });
        
        mazeData = data;
        
        if (!pathFound) {
          nodeExpanded += (data.expanded || 1);
          console.log('➕ Expanded:', nodeExpanded);  // Debug accumulate
        }
        pathLength = data.pathLen || pathLength;  // Update path nếu có từ server

        // v6: ALWAYS update live metrics first (direct call, time tăng mỗi tick)
        if (perfStart !== null) {
          drawMaze(mazeData, false, persistentPath, null);
          updateAlgoMetrics(currentSeconds, pathLength, nodeExpanded);  // DIRECT: Pass numbers → metrics auto-update DOM
        }

        // Detect flags (guard early freeze >=1s)
        if ((data.pathFound === true || data.pathFound === 1 || !data.running) && currentSeconds >= 1) {
          console.log(`🎉 PATH FOUND via flags (tick #${tickCounter}, time ${currentSeconds}s)`);
          
          pathFound = true;
          
          // v6 Path debug
          const calcLen = calculatePathLength(mazeData);
          pathLength = data.pathLen || calcLen;
          console.log('📏 Path debug: data.pathLen=', data.pathLen, '| calcLen (cells=5)=', calcLen, '| final=', pathLength);
          
          if (data.path && Array.isArray(data.path)) {
            persistentPath = data.path.map(p => 
              typeof p === 'object' && p.x !== undefined ? p : {x: p[0], y: p[1]}
            );
            pathLength = persistentPath.length;  // Force from array
            console.log('📏 Overrode pathLength from data.path array:', pathLength);
          }
          
          frozenAlgoTime = currentSeconds || 1;
          frozenNodeExpanded = nodeExpanded;
          
          console.log(`🧊 FROZEN: Seconds: ${frozenAlgoTime} | Path: ${pathLength} | Expanded: ${frozenNodeExpanded} | Ticks: ${tickCounter}`);
          
          // v6: DEBUG pre-call (sẽ pass numbers đúng)
          console.log('🔍 Pre-freeze metrics call: time=', frozenAlgoTime, 'path=', pathLength, 'expanded=', frozenNodeExpanded);
          
          // DIRECT CALL: Pass numbers → metrics update DOM đúng (22|323|541)
          updateAlgoMetrics(frozenAlgoTime, pathLength, frozenNodeExpanded);
          drawMaze(mazeData, true, persistentPath, null);
          
          perfStart = null;
          clearTimeout(timeoutId);
          stopAlgo();
          return;
        }
        
        // Fallback goalValue=5 (with guard)
        let goalValue = null;
        const cells = data.cells || data;
        if (Array.isArray(cells) && cells[goalX] && cells[goalX][goalY] !== undefined) {
          goalValue = cells[goalX][goalY];
        }
        if (goalValue === 5 && currentSeconds >= 1) {
          console.log(`🎉 FALLBACK PATH FOUND (tick #${tickCounter}, time ${currentSeconds}s)`);
          
          pathFound = true;
          
          const calcLen = calculatePathLength(mazeData);
          pathLength = data.pathLen || calcLen;
          console.log('📏 Fallback path debug: data.pathLen=', data.pathLen, '| calcLen=', calcLen, '| final=', pathLength);
          
          frozenAlgoTime = currentSeconds || 1;
          frozenNodeExpanded = nodeExpanded;
          
          console.log(`🧊 FROZEN (fallback): Seconds: ${frozenAlgoTime} | Path: ${pathLength} | Expanded: ${frozenNodeExpanded} | Ticks: ${tickCounter}`);
          
          // v6: DEBUG pre-call
          console.log('🔍 Pre-fallback metrics call: time=', frozenAlgoTime, 'path=', pathLength, 'expanded=', frozenNodeExpanded);
          
          // DIRECT CALL
          updateAlgoMetrics(frozenAlgoTime, pathLength, frozenNodeExpanded);
          drawMaze(mazeData, true, persistentPath, null);
          
          perfStart = null;
          clearTimeout(timeoutId);
          stopAlgo();
          return;
        }
      })
      .catch(err => {
        console.error(`❌ Tick #${tickCounter} error:`, err);
        clearTimeout(timeoutId);
        stopAlgo();
      });
  }, 40);
}

export function calculatePathLength(mazeData) {
  let len = 0;
  const cells = mazeData.cells || mazeData;
  console.log('🔢 Calc path: cells type=', typeof cells, '| isArray=', Array.isArray(cells), '| length=', cells?.length);
  if (Array.isArray(cells)) {
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[i]?.length; j++) {  // Safe if row undefined
        if (cells[i][j] === 5) len++;
      }
    }
  }
  console.log('🔢 Final calc path len:', len);
  return len;
}

export function stopAlgo() {
  runningAlgo = false;
  if (algoInterval) {
    clearInterval(algoInterval);
    algoInterval = null;
    console.log(`⏹️ Stopped. Ticks: ${tickCounter} | Final time: ${frozenAlgoTime}s | Path: ${pathLength}`);
  }
}

export function fetchMaze(endpoint, mazeData, drawMaze, stopAlgo, resetPlayerMetrics, updatePlayerPos, updateGoalPos) {
  fetch(`${SERVER_URL}${endpoint}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      mazeData = data;
      drawMaze(mazeData, false, [], null);
      stopAlgo();
      resetPlayerMetrics(/* params */);
      updatePlayerPos(mazeData);
      updateGoalPos(mazeData);
    });
}