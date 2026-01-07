#include "DFS.h"
#include "../Maze/maze.h"
#include <stack>

static std::stack<Cell*> st;

void startDFS() {
    resetMaze();

    while (!st.empty()) st.pop();

    startCell->visited = true;
    startCell->parent = nullptr;

    st.push(startCell);

    running = true;
    pathFound = false;
}

void stepDFS() {
    if (!running || st.empty()) return;

    Cell* current = st.top();
    st.pop();

    if (current == goalCell) {
        markPath();
        running = false;
        pathFound = true;
        return;
    }

    for (Cell* n : getNeighbors(current)) {
        if (!n->visited) {
            n->visited = true;
            n->parent = current;
            st.push(n);
        }
    }
}
