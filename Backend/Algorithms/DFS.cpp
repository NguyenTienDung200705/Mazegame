#include "DFS.h"
#include "../Maze/maze.h"
#include <stack>

static std::stack<Cell*> st;

void startDFS() {
    //Kiểm tra điều kiện an toàn
    if (!startCell || !goalCell) {
        printf("Lỗi.\n");
        running = false;
        return;
    }
    resetMaze();
    while (!st.empty()) st.pop(); //Làm rỗng stack

    startCell->visited = true; //Khởi tạo ô start
    startCell->parent = nullptr;//Đánh dấu Node Cha

    st.push(startCell);//B1

    running = true;
    pathFound = false;
}

void stepDFS() {
    //Kiểm tra đk an toàn
    if (!running || st.empty() || !goalCell) return;
    Cell* current = st.top(); //Lấy ra ô trên cùng
    st.pop(); //Xóa ô trên cùng
    if (current == goalCell) {
        markPath(); //lần ngược parent để vẽ đường đi
        running = false; 
        pathFound = true; 
        return;
    }
    for (Cell* n : getNeighbors(current)) // Lấy Ds ô kề
    {
        if (!n->visited) // Ktra xem đi chưa
        {
            n->visited = true; 
            n->parent = current;
            st.push(n);
        }
    }
}