#include "BFS.h"
#include "../Maze/maze.h"
#include <queue>

static std::queue<Cell*> q;

void startBFS() {
    resetMaze();
    while (!q.empty()) q.pop();

    startCell->visited = true;
    startCell->g = 0;
    q.push(startCell);

    running = true;
    pathFound = false;
}

void stepBFS() {
    if (q.empty() || pathFound) {
        running = false;
        return;
    }

    Cell* current = q.front();
    q.pop();

    if (current == goalCell) {
        markPath();
        pathFound = true;
        running = false;
        return;
    }

    for (Cell* n : getNeighbors(current)) {
        if (!n->visited) {
            n->visited = true;
            n->parent = current;
            n->g = current->g + 1;
            q.push(n);
        }
    }
}
