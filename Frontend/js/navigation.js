// navigation.js (hoàn chỉnh - fixed)
// Import cần thiết (không import startGame trực tiếp để tránh params phức tạp)
import { hideAllSections } from './utils.js';

export function setupNavigation(welcome, modeSelection, difficultySelection, mazeContainer, backToWelcome, backToMode, readyBtn, randomBtn, levelBtn, onStartGame) {
  // Helper function để attach events (tránh inline onclick nếu cần, nhưng giữ đơn giản)
  readyBtn.addEventListener('click', () => {
    hideAllSections([welcome, modeSelection, difficultySelection, mazeContainer]);
    modeSelection.style.display = 'flex';
    console.log('Chuyển sang chọn mode'); // Debug log
  });

  backToWelcome.addEventListener('click', () => {
    hideAllSections([welcome, modeSelection, difficultySelection, mazeContainer]);
    welcome.style.display = 'flex';
    console.log('Quay lại welcome'); // Debug
  });

  randomBtn.addEventListener('click', () => {
    const diff = 25; // Mặc định cho random
    if (onStartGame) {
      onStartGame(diff);
    }
    console.log('Random mode selected với difficulty:', diff);
  });

  levelBtn.addEventListener('click', () => {
    hideAllSections([welcome, modeSelection, difficultySelection, mazeContainer]);
    difficultySelection.style.display = 'flex';
    console.log('Chuyển sang chọn difficulty'); // Debug
  });

  backToMode.addEventListener('click', () => {
    hideAllSections([welcome, modeSelection, difficultySelection, mazeContainer]);
    modeSelection.style.display = 'flex';
    console.log('Quay lại mode selection'); // Debug
  });

  // Setup events cho các button difficulty (sử dụng difficultySelection từ params)
  const diffButtons = difficultySelection.querySelectorAll('button[data-diff]');
  if (diffButtons.length > 0) {
    diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = parseInt(btn.dataset.diff);
        if (onStartGame) {
          onStartGame(diff);
        }
        console.log(`Difficulty ${diff} selected`);
      });
    });
  } else {
    console.warn('Không tìm thấy button[data-diff] trong difficultySelection!'); // Debug nếu DOM lỗi
  }
}