#include "player.h"
#include "../Maze/maze.h"

void movePlayer(std::string dir) {
    int nx = playerX, ny = playerY;
    if (dir=="UP") nx--;
    else if (dir=="DOWN") nx++;
    else if (dir=="LEFT") ny--;
    else if (dir=="RIGHT") ny++;

    if (nx>=0 && nx<ROWS && ny>=0 && ny<COLS && !maze[nx][ny].wall) {
        playerX = nx;
        playerY = ny;
    }
}
