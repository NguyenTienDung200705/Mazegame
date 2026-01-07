// js/view/MazeView.js
import * as M from "../model/MazeModel.js";

export function drawMaze() {
  const mazeDiv = document.getElementById('maze');
  mazeDiv.innerHTML = '';

  console.log('Bắt đầu vẽ mê cung với data:', M.mazeData);

  // ===== FORMAT MỚI (LINE-BASED) =====
  if (M.mazeData.hWalls && M.mazeData.vWalls && M.mazeData.cells) {
    console.log('Sử dụng format mới (line-based với đường kẻ)');

    const ROWS = M.mazeData.cells.length;
    const COLS = M.mazeData.cells[0].length;

    const availableWidth = window.innerWidth * 0.85 / (COLS + 1);
    const availableHeight = window.innerHeight * 0.7 / (ROWS + 1);
    const cellSize = Math.min(availableWidth, availableHeight, 25);

    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'column';
    gridContainer.style.lineHeight = '0';

    for (let i = 0; i <= ROWS; i++) {
      // ===== HORIZONTAL WALL =====
      const hWallRow = document.createElement('div');
      hWallRow.style.display = 'flex';
      hWallRow.style.height = '1px';
      hWallRow.style.background = 'transparent';

      for (let j = 0; j < COLS; j++) {
        const seg = document.createElement('div');
        seg.style.width = `${cellSize}px`;
        seg.style.height = '100%';
        seg.style.background = M.mazeData.hWalls[i][j] ? '#333' : '#ccc';
        hWallRow.appendChild(seg);
      }
      gridContainer.appendChild(hWallRow);

      // ===== CELL ROW =====
      if (i < ROWS) {
        const cellRow = document.createElement('div');
        cellRow.style.display = 'flex';
        cellRow.style.height = `${cellSize}px`;

        for (let j = 0; j < COLS; j++) {
          // Vertical wall
          const vWall = document.createElement('div');
          vWall.style.width = '1px';
          vWall.style.height = `${cellSize}px`;
          vWall.style.background = M.mazeData.vWalls[i][j] ? '#333' : '#ccc';
          cellRow.appendChild(vWall);

          // Cell
          const cell = document.createElement('div');
          cell.style.width = `${cellSize}px`;
          cell.style.height = `${cellSize}px`;

          const val = M.mazeData.cells[i][j];

          if (val === 2) {
            cell.classList.add('player');
          } 
          else if (val === 3) {
            cell.classList.add('goal');
            cell.style.background = '#FF0000';
            cell.style.boxShadow = '0 0 15px rgba(255,0,0,0.8)';
          } 
          else if (val === 4) {
            cell.classList.add('visited');
            cell.style.background = '#00C800';
          } 
          else if (
            val === 5 ||
            (M.pathFound && M.persistentPath.some(p => p.x === i && p.y === j))
          ) {
            cell.classList.add('pathfound');
            cell.style.background = '#FF0000';
          }

          cellRow.appendChild(cell);
        }

        // Last vertical wall
        const lastVWall = document.createElement('div');
        lastVWall.style.width = '1px';
        lastVWall.style.height = `${cellSize}px`;
        lastVWall.style.background = M.mazeData.vWalls[i][COLS] ? '#333' : '#ccc';
        cellRow.appendChild(lastVWall);

        gridContainer.appendChild(cellRow);
      }
    }

    mazeDiv.appendChild(gridContainer);
    mazeDiv.style.width = `${(COLS + 1) * cellSize}px`;
    mazeDiv.style.height = `${(ROWS + 1) * cellSize}px`;

    console.log('Vẽ mê cung line-based thành công');
    return;
  }

  // ===== FORMAT CŨ (CELL-BASED) =====
  if (Array.isArray(M.mazeData)) {
    console.log('Sử dụng format cũ (cell-based)');

    const ROWS = M.mazeData.length;
    const COLS = M.mazeData[0].length;
    const cellSize = Math.min(
      window.innerWidth * 0.85 / COLS,
      window.innerHeight * 0.7 / ROWS,
      25
    );

    M.mazeData.forEach((row, i) => {
      const r = document.createElement('div');
      r.style.display = 'flex';

      row.forEach((c, j) => {
        const d = document.createElement('div');
        d.style.width = `${cellSize}px`;
        d.style.height = `${cellSize}px`;
        d.style.border = '1px solid #ccc';

        if (c === 1) d.style.background = '#222';
        if (c === 2) d.classList.add('player');
        if (c === 3) {
          d.classList.add('goal');
          d.style.background = '#FF0000';
          d.style.boxShadow = '0 0 15px rgba(255,0,0,0.8)';
        }
        if (c === 4) {
          d.classList.add('visited');
          d.style.background = '#00C800';
        }
        if (
          c === 5 ||
          (M.pathFound && M.persistentPath.some(p => p.x === i && p.y === j))
        ) {
          d.classList.add('pathfound');
          d.style.background = '#FF0000';
        }

        r.appendChild(d);
      });

      mazeDiv.appendChild(r);
    });

    mazeDiv.style.width = `${COLS * cellSize}px`;
    mazeDiv.style.height = `${ROWS * cellSize}px`;
    console.log('Vẽ mê cung cell-based thành công');
    return;
  }

  // ===== FALLBACK =====
  console.error('Dữ liệu mê cung không hợp lệ:', M.mazeData);
}
