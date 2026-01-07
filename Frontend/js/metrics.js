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
  // reset giá trị ban đầu
  playerStartTime = Date.now();
  playerSteps = 0;
  playerNodes = 1;

  // reset timer
  if (playerTimer) clearInterval(playerTimer);
  playerTimer = setInterval(updatePlayerMetrics, 1000);

  // cập nhật UI lần đầu
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
  // ⏱️ thời gian luôn tăng vì Date.now() thay đổi liên tục
  const elapsed = Math.floor((Date.now() - playerStartTime) / 1000);

  timeSpan.textContent  = elapsed;      // ✅ CHẠY
  stepsSpan.textContent = playerSteps;  // ❌ KHÔNG ĐỔI
  nodesSpan.textContent = playerNodes;  // ❌ KHÔNG ĐỔI
}

export function updateAlgoMetrics(
  algoTimeSpan,
  pathLenSpan,
  expandedSpan,
  algoStartTime,
  pathLength,
  nodeExpanded
) {
  const algoElapsed = Math.floor((Date.now() - algoStartTime) / 1000);

  algoTimeSpan.textContent = algoElapsed;
  pathLenSpan.textContent  = pathLength;
  expandedSpan.textContent = nodeExpanded;
}
