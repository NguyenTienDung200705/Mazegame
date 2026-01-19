#include "BFS.h"
#include "../Maze/maze.h"
#include <queue>

static std::queue<Cell*> q;

void startBFS() {
    // Kiểm tra đk an toàn
    if (!startCell || !goalCell) {
        printf("Lỗi .\n");
        running = false;
        return;
    }
    // Reset 
    resetMaze();
    while (!q.empty()) q.pop();

    startCell->visited = true; // Đánh dấu vtri dc xét
    startCell->g = 0; //d(start,chính nó)=0
    q.push(startCell); // Đưa startCell vào CUỐI hàng đợi

    running = true;
    pathFound = false;
}

void stepBFS() {
    // Kiểm tra
    if (!running || q.empty() || pathFound || !goalCell) {
        running = false;
        return;
    }
    // Lấy đỉnh đầu tiên trong queue (FIFO)
    Cell* current = q.front();
    q.pop();
    // Kiểm tra xem tới đích chưa
    if (current == goalCell) {
        markPath();
        pathFound = true;
        running = false;
        return;
    }
    // Duyệt các ô kề
    for (Cell* n : getNeighbors(current)) {
        if (!n->visited) {
            n->visited = true;
            n->parent = current;
            n->g = current->g + 1;
            q.push(n);
        }
    }
}