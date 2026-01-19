// metrics.js (fixed v9.0 - add ticks param, auto-find ticks span, remove unused import, robust safeguard)
export function resetPlayerMetrics(
  playerStartTime,
  playerSteps,
  playerNodes,
  playerTimer,
  updatePlayerMetrics,
  timeSpan,
  stepsSpan,
  nodesSpan
) {
  playerStartTime = Date.now();
  playerSteps = 0;
  playerNodes = 1;

  if (playerTimer) clearInterval(playerTimer);
  playerTimer = setInterval(updatePlayerMetrics, 1000);

  updatePlayerMetrics(
    timeSpan,
    stepsSpan,
    nodesSpan,
    playerStartTime,
    playerSteps,
    playerNodes
  );
}

export function updatePlayerMetrics(
  timeSpan,
  stepsSpan,
  nodesSpan,
  playerStartTime,
  playerSteps,
  playerNodes
) {
  const elapsed = Math.floor((Date.now() - playerStartTime) / 1000);

  timeSpan.textContent  = elapsed;
  stepsSpan.textContent = playerSteps;
  nodesSpan.textContent = playerNodes;
}

// FIXED v9: 3-4 params (time, path, expanded, [ticks] from algo.js). Auto-find spans (incl. ticks).
export function updateAlgoMetrics(time, pathLength, nodeExpanded, ticks = null) {
  // DEBUG raw params (xóa sau test)
  console.log('🔍 Metrics raw params: time=', time, 'path=', pathLength, 'expanded=', nodeExpanded, 'ticks=', ticks);

  // FIXED: Auto-find spans from document (robust selectors for IDs/classes/fallback children)
  let algoTimeSpan = document.querySelector('#algoTime, #algo-time, .algo-time, .time-span, #algoMetrics span:first-child');
  let pathLenSpan = document.querySelector('#pathLen, #algo-path, .algo-path, .path-span, #algoMetrics span:nth-child(2)');
  let expandedSpan = document.querySelector('#expanded, #algo-expanded, .algo-expanded, .expanded-span, #algoMetrics span:nth-child(3)');
  let ticksSpan = document.querySelector('#ticks, .ticks-span, #algoMetrics span:last-child');  // New: for ticks

  // Fallback to #algoMetrics children if IDs/classes not found (assume order: time, path, expanded, [ticks])
  const algoMetrics = document.getElementById('algoMetrics');
  if (algoMetrics && algoMetrics.children.length >= 3) {
    if (!algoTimeSpan) algoTimeSpan = algoMetrics.children[0];
    if (!pathLenSpan) pathLenSpan = algoMetrics.children[1];
    if (!expandedSpan) expandedSpan = algoMetrics.children[2];
    if (ticks !== null && algoMetrics.children.length >= 4 && !ticksSpan) {
      ticksSpan = algoMetrics.children[3];
    }
  }

  if (!algoTimeSpan || !pathLenSpan || !expandedSpan) {
    console.warn('⚠️ Metrics spans not found in DOM - check #algoMetrics structure (F12 inspect)');
    return;
  }

  // DEBUG spans (xóa sau)
  console.log('🔧 Auto-found spans: time=', algoTimeSpan.id || 'found', 'path=', pathLenSpan.id || 'found', 'expanded=', expandedSpan.id || 'found', 'ticks=', ticksSpan?.id || 'N/A');

  // v9 Safeguard: Robust check (handle if param is DOM/object → fallback 0/1)
  const safeTime = (typeof time === 'number' && !isNaN(time) && time >= 0) ? Math.max(time, 1) : 1;
  const safePath = (typeof pathLength === 'number' && !isNaN(pathLength) && pathLength >= 0) ? pathLength : 0;
  const safeExpanded = (typeof nodeExpanded === 'number' && !isNaN(nodeExpanded) && nodeExpanded >= 0) ? nodeExpanded : 0;
  const safeTicks = (typeof ticks === 'number' && !isNaN(ticks) && ticks >= 0) ? ticks : null;

  // Update spans
  algoTimeSpan.textContent = safeTime;
  pathLenSpan.textContent  = safePath;
  expandedSpan.textContent = safeExpanded;
  if (ticksSpan && safeTicks !== null) {
    ticksSpan.textContent = safeTicks;
  }

  // v9: Full frozen-style log (như mong muốn)
  const ticksDisplay = safeTicks !== null ? safeTicks : (safeExpanded + 1);  // Fallback ticks = expanded +1 nếu không truyền
  console.log(`🧊 FROZEN: Seconds: ${safeTime} | Path: ${safePath} | Expanded: ${safeExpanded} | Ticks: ${ticksDisplay}`);

  // Debug log (xóa sau)
  console.log('📊 Algo metrics updated: Time:', safeTime + 's', '| Path:', safePath, '| Expanded:', safeExpanded, '| Ticks:', ticksDisplay);
}