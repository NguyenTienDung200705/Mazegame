#include "AStar.h"
#include "../Maze/maze.h"
#include <queue>
#include <cmath>

struct CompareCell {
    bool operator()(Cell* a, Cell* b) {
        return (a->g + a->h) > (b->g + b->h);
    }
};

static std::priority_queue<Cell*, std::vector<Cell*>, CompareCell> openSet;

/* Heuristic: Manhattan distance */
static int heuristic(Cell* a, Cell* b) {
    return abs(a->x - b->x) + abs(a->y - b->y);
}

void startAStar() {
    resetMaze();

    while (!openSet.empty()) openSet.pop();

    startCell->g = 0;
    startCell->h = heuristic(startCell, goalCell);
    startCell->visited = true;

    openSet.push(startCell);
    running = true;
    pathFound = false;
}

void stepAStar() {
    if (!running || openSet.empty()) return;

    Cell* current = openSet.top();
    openSet.pop();

    if (current == goalCell) {
        markPath();
        pathFound = true;
        running = false;
        return;
    }

    for (Cell* n : getNeighbors(current)) {
        int tentativeG = current->g + 1;

        if (!n->visited || tentativeG < n->g) {
            n->visited = true;
            n->parent = current;
            n->g = tentativeG;
            n->h = heuristic(n, goalCell);
            openSet.push(n);
        }
    }
}
