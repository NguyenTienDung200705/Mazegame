// utils.js
export function hideAllSections(sections) {
  sections.forEach(s => s.style.display = 'none');
}

export function checkWin(playerX, playerY, goalX, goalY, playerTimer, successMessage) {
  if (playerX === goalX && playerY === goalY) {
    if (playerTimer) clearInterval(playerTimer);
    successMessage.style.opacity = '1';
    console.log('🎉 Player won!');
  }
}

export function resetGame(persistentPath, pathFound, stopAlgo, fetchMaze, successMessage, algoMetrics) {
  persistentPath.length = 0; // Clear array
  pathFound = false;
  stopAlgo();
  fetchMaze('/reset');
  successMessage.style.opacity = '0';
  algoMetrics.style.display = 'none';
  console.log('🔄 Game reset');
}