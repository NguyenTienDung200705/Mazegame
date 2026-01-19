#include "maze.h"
#include <cstdlib>
#include <ctime>
#include <algorithm>
#include <random>

using json = nlohmann::json;

Cell maze[ROWS][COLS];
Cell* startCell = nullptr;
Cell* goalCell = nullptr;

bool running = false;
bool pathFound = false;
int playerX = 0, playerY = 0;

/* ================= RESET ================= */

void resetMaze() {
    for (int i = 0; i < ROWS; i++)
        for (int j = 0; j < COLS; j++) {
            maze[i][j].visited = false;
            maze[i][j].parent = nullptr;
            maze[i][j].g = INT_MAX;
            maze[i][j].h = 0;
            maze[i][j].onPath = false;
        }
    // Do not reset startCell or goalCell here; they persist across resets
}

/* ================= SET START/GOAL ================= */

// New: Allow setting custom start position
void setStartCell(int x, int y) {
    if (x >= 0 && x < ROWS && y >= 0 && y < COLS && !maze[x][y].wall) {
        // Clear old start if exists
        if (startCell) {
            // Optionally reset old start visual, but since no val=2 there, just set
            startCell = nullptr;
        }
        startCell = &maze[x][y];
        playerX = x;
        playerY = y;
        startCell->g = 0;
        startCell->parent = nullptr;
        // Ensure not visited/onPath
        startCell->visited = false;
        startCell->onPath = false;
        printf("Start set to (%d, %d)\n", x, y);  // Debug log
    } else {
        printf("Invalid start position: (%d, %d) is wall or out of bounds\n", x, y);
    }
}

// New: Allow setting custom goal position
void setGoalCell(int x, int y) {
    if (x >= 0 && x < ROWS && y >= 0 && y < COLS && !maze[x][y].wall) {
        // Clear old goal if exists
        if (goalCell) {
            // Optionally reset old goal visual
            goalCell = nullptr;
        }
        goalCell = &maze[x][y];
        goalCell->g = INT_MAX;
        goalCell->parent = nullptr;
        // Ensure not visited/onPath
        goalCell->visited = false;
        goalCell->onPath = false;
        printf("Goal set to (%d, %d)\n", x, y);  // Debug log
    } else {
        printf("Invalid goal position: (%d, %d) is wall or out of bounds\n", x, y);
    }
}

/* ================= DFS MAZE GENERATION ================= */

enum Difficulty {
    EASY,
    MEDIUM,
    HARD
};

std::vector<Cell*> getDFSNeighbors(Cell* c) {
    std::vector<Cell*> res;
    int dx[4] = { -2, 2, 0, 0 };
    int dy[4] = { 0, 0, -2, 2 };

    for (int i = 0; i < 4; i++) {
        int nx = c->x + dx[i];
        int ny = c->y + dy[i];

        if (nx > 0 && nx < ROWS - 1 &&
            ny > 0 && ny < COLS - 1 &&
            !maze[nx][ny].visited) {
            res.push_back(&maze[nx][ny]);
        }
    }
    return res;
}

std::vector<Cell*> getNeighbors(Cell* c) {
    std::vector<Cell*> n;
    int dx[4] = { -1, 1, 0, 0 };
    int dy[4] = { 0, 0, -1, 1 };

    for (int i = 0; i < 4; i++) {
        int nx = c->x + dx[i];
        int ny = c->y + dy[i];

        if (nx >= 0 && nx < ROWS &&
            ny >= 0 && ny < COLS &&
            !maze[nx][ny].wall) {
            n.push_back(&maze[nx][ny]);
        }
    }
    return n;
}

void shuffleDirections(std::vector<Cell*>& v, Difficulty diff) {
    int chance = 0;
    if (diff == EASY) chance = 70;
    else if (diff == MEDIUM) chance = 40;
    else chance = 0;

    if (rand() % 100 >= chance) {
        static std::mt19937 rng(time(nullptr));
        std::shuffle(v.begin(), v.end(), rng);
    }
}

void dfsGenerate(Cell* c, Difficulty diff) {
    c->visited = true;
    c->wall = false;

    auto neighbors = getDFSNeighbors(c);
    shuffleDirections(neighbors, diff);

    for (Cell* n : neighbors) {
        if (!n->visited) {
            int wx = (c->x + n->x) / 2;
            int wy = (c->y + n->y) / 2;
            maze[wx][wy].wall = false;

            dfsGenerate(n, diff);
        }
    }
}

/* ================= DEAD-END EXTENSION ================= */

int countOpenNeighbors(Cell* c) {
    int cnt = 0;
    int dx[4] = { -1, 1, 0, 0 };
    int dy[4] = { 0, 0, -1, 1 };

    for (int i = 0; i < 4; i++) {
        int nx = c->x + dx[i];
        int ny = c->y + dy[i];
        if (nx >= 0 && nx < ROWS && ny >= 0 && ny < COLS && !maze[nx][ny].wall)
            cnt++;
    }
    return cnt;
}

void extendDeadEnds(int length) {
    for (int i = 1; i < ROWS - 1; i += 2) {
        for (int j = 1; j < COLS - 1; j += 2) {
            Cell* c = &maze[i][j];
            if (!c->wall && countOpenNeighbors(c) == 1) {
                Cell* cur = c;
                for (int k = 0; k < length; k++) {
                    auto nbs = getDFSNeighbors(cur);
                    if (nbs.empty()) break;

                    Cell* next = nbs[rand() % nbs.size()];
                    int wx = (cur->x + next->x) / 2;
                    int wy = (cur->y + next->y) / 2;

                    maze[wx][wy].wall = false;
                    next->wall = false;
                    cur = next;
                }
            }
        }
    }
}

/* ================= MAIN GENERATE ================= */

// Modified: No longer auto-sets start/goal; client will call setStartCell/setGoalCell after generation
void generateMaze(int /*wallDensity*/) {
    srand((unsigned)time(NULL));

    // 1️⃣ Khởi tạo toàn bộ là tường
    for (int i = 0; i < ROWS; i++)
        for (int j = 0; j < COLS; j++) {
            maze[i][j] = { i, j };
            maze[i][j].wall = true;
            maze[i][j].visited = false;
            maze[i][j].onPath = false;
        }

    // 2️⃣ NO AUTO Start & Goal; client sets them via /setStart and /setGoal
    startCell = nullptr;
    goalCell = nullptr;
    playerX = 0;
    playerY = 0;

    // 3️⃣ DFS sinh mê cung (start from a default cell, e.g., [1][1], but don't set as start)
    Cell* genStart = &maze[1][1];
    dfsGenerate(genStart, HARD);

    // 4️⃣ Dead-end dài
    extendDeadEnds(4);

    // 5️⃣ Ensure generation start is open (but not as player start)
    genStart->wall = false;

    // 6️⃣ Reset cho gameplay
    resetMaze();
    running = false;
    pathFound = false;
}

/* ================= PATH MARK ================= */

void markPath() {
    if (!goalCell || !startCell) return;  // Safety check
    Cell* cur = goalCell;
    while (cur && cur != startCell) {
        cur->onPath = true;
        cur = cur->parent;
    }
    if (startCell)
        startCell->onPath = true;
}

/* ================= JSON ================= */

/* ================= JSON ================= */
json mazeToJson() {
    json cells = json::array();  // Cells as array

    for (int i = 0; i < ROWS; i++) {
        json row = json::array();
        for (int k = 0; k < COLS; k++) {
            int val = maze[i][k].wall ? 1 : 0;

            // Player position
            if (i == playerX && k == playerY)
                val = 2;  // Player
            // Goal - override if onPath
            else if (goalCell && i == goalCell->x && k == goalCell->y)
                val = maze[i][k].onPath ? 5 : 3;  // 5 if found, else 3
            // Path
            else if (maze[i][k].onPath)
                val = 5;  // Path
            // Visited
            else if (maze[i][k].visited)
                val = 4;  // Visited

            row.push_back(val);
        }
        cells.push_back(row);
    }

    // FIXED: Root object with flags for JS stop
    json j;
    j["cells"] = cells;
    j["pathFound"] = pathFound;  // Bool
    j["running"] = running;
    int pathLen = 0;
    for (int i = 0; i < ROWS; i++)
        for (int k = 0; k < COLS; k++)
            if (maze[i][k].onPath) pathLen++;
    j["pathLen"] = pathLen;
    return j;
}