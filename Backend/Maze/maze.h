#pragma once
#include <vector>
#include "../third_party/json.hpp"
#include "../utils/Constants.h"

// ================= GLOBAL DATA =================
extern Cell maze[ROWS][COLS];
extern Cell* startCell;
extern Cell* goalCell;

extern int playerX, playerY;
extern bool running;
extern bool pathFound;

// ================= CORE =================
void resetMaze();
void generateMaze(int wallDensity);
void markPath();

// ================= GAMEPLAY / ALGO =================
// Dùng cho BFS / DFS / A* / Dijkstra (di chuyển 4 hướng)
std::vector<Cell*> getNeighbors(Cell* c);

// ================= EXPORT =================
nlohmann::json mazeToJson();
