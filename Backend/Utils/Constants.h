#pragma once
#include <climits>

#define ROWS 31
#define COLS 49

struct Cell {
    int x, y;
    bool wall = false;
    bool visited = false;
    bool onPath = false;
    int g = INT_MAX, h = 0;
    Cell* parent = nullptr;
};

enum Algo { NONE, DFS_ALGO, BFS_ALGO, ASTAR_ALGO };
