#include "AStar.h"
#include "../Maze/maze.h"
#include <queue>
#include <cmath>
#include <utility>  // for std::pair

/* Heuristic: Manhattan distance */
static int heuristic(Cell* a, Cell* b) {
    return abs(a->x - b->x) + abs(a->y - b->y);
}

// Define INF if not in maze.h (use a large number)
#ifndef INF
#define INF 999999
#endif

// Priority queue for min-heap (smallest f first)
static std::priority_queue<std::pair<int, Cell*>,
                           std::vector<std::pair<int, Cell*>>,
                           std::greater<std::pair<int, Cell*>>> openSet;

void startAStar() {
    if (!startCell || !goalCell) {
        printf("Lỗi: .\n");
        running = false;
        return;
    }
    resetMaze();
    while (!openSet.empty()) openSet.pop();

    startCell->g = 0;
    startCell->h = heuristic(startCell, goalCell);
    startCell->parent = nullptr; 

    openSet.push({startCell->g + startCell->h, startCell});
    running = true;
    pathFound = false;
}

void stepAStar() {
    if (!running || openSet.empty() || !goalCell) return;
    auto current_pair = openSet.top();
    openSet.pop();
    int f = current_pair.first;
    Cell* current = current_pair.second;

    if (f > current->g + current->h) {
        return;
    }
    current->visited = true;

    if (current == goalCell) {
        markPath();
        pathFound = true;
        running = false; 
        return;
    }
    for (Cell* n : getNeighbors(current)) {
        if (n->visited) continue;
        int tentativeG = current->g + 1;

        if (tentativeG < n->g) {
            n->parent = current;
            n->g = tentativeG;
            n->h = heuristic(n, goalCell);
            openSet.push({n->g + n->h, n});
        }
    }
}