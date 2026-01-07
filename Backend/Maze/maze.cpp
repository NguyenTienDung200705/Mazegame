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

    // 2️⃣ Start & Goal (tọa độ lẻ)
    startCell = &maze[1][1];
    goalCell  = &maze[ROWS - 2][COLS - 2];

    // 3️⃣ DFS sinh mê cung
    dfsGenerate(startCell, HARD);

    // 4️⃣ Dead-end dài
    extendDeadEnds(4);

    // 5️⃣ Đảm bảo mở start/goal
    startCell->wall = false;
    goalCell->wall = false;

    // 6️⃣ Reset cho gameplay
    resetMaze();
    playerX = startCell->x;
    playerY = startCell->y;
    running = false;
    pathFound = false;
}

/* ================= PATH MARK ================= */

void markPath() {
    Cell* cur = goalCell;
    while (cur && cur != startCell) {
        cur->onPath = true;
        cur = cur->parent;
    }
    if (startCell)
        startCell->onPath = true;
}

/* ================= JSON ================= */

json mazeToJson() {
    json j = json::array();

    for (int i = 0; i < ROWS; i++) {
        json row = json::array();
        for (int k = 0; k < COLS; k++) {
            int val = maze[i][k].wall ? 1 : 0;

            if (i == playerX && k == playerY)
                val = 2;          // Player
            else if (maze[i][k].onPath)
                val = 5;          // Path
            else if (&maze[i][k] == goalCell)
                val = 3;          // Goal
            else if (maze[i][k].visited)
                val = 4;          // Visited

            row.push_back(val);
        }
        j.push_back(row);
    }
    return j;
}
