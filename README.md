# 🧩 Maze Game

<p align="center">
  <img src="https://img.shields.io/badge/Python-Game-blue">
  <img src="https://img.shields.io/badge/Algorithm-Pathfinding-green">
  <img src="https://img.shields.io/badge/Status-Completed-success">
</p>

---

## 📌 Introduction

Maze Game là một trò chơi giải mê cung được xây dựng bằng Python, trong đó người chơi điều khiển nhân vật từ điểm bắt đầu đến điểm đích thông qua các đường đi hợp lệ.

Dự án giúp minh họa các khái niệm quan trọng trong lập trình và thuật toán như:

* Cấu trúc dữ liệu (matrix, queue, stack)
* Thuật toán tìm đường (BFS, DFS, A*)
* Game loop
* Event handling

---

## 🎯 Objectives

* Xây dựng trò chơi mê cung hoàn chỉnh
* Thiết kế hệ thống điều khiển nhân vật
* Áp dụng thuật toán tìm đường
* Tạo nền tảng mở rộng cho game

---

## 🧠 Core Concepts

### 🔹 Maze Representation

Mê cung được biểu diễn dưới dạng ma trận 2D:

| Ký hiệu | Ý nghĩa  |
| ------- | -------- |
| `0`     | Đường đi |
| `1`     | Tường    |
| `S`     | Start    |
| `G`     | Goal     |

Ví dụ:

```
##########
#S   #   #
# ## # # #
#    #  G#
##########
```

---

### 🔹 Coordinate System

Mỗi ô được xác định bởi tọa độ:

```
(x, y)
```

* `x`: hàng
* `y`: cột

---

### 🔹 Player Movement

Người chơi di chuyển theo 4 hướng:

* Up → `(x-1, y)`
* Down → `(x+1, y)`
* Left → `(x, y-1)`
* Right → `(x, y+1)`

Điều kiện hợp lệ:

```
maze[x][y] != 1
```

---

### 🔹 Win Condition

```python
if player_pos == goal_pos:
    print("You Win!")
```

---

## 🤖 Pathfinding Algorithms

### 🔸 BFS (Breadth-First Search)

* Tìm đường ngắn nhất
* Đảm bảo tối ưu

Pseudo-code:

```
Initialize queue
Push start node

While queue not empty:
    current = pop

    If current == goal:
        return path

    For each neighbor:
        If valid:
            push to queue
```

---

### 🔸 DFS (Depth-First Search)

* Duyệt sâu trước
* Không đảm bảo tối ưu

---

### 🔸 A* Algorithm

Công thức:

```
f(n) = g(n) + h(n)
```

Heuristic:

```
h(n) = |x1 - x2| + |y1 - y2|
```

---

## 🧱 System Architecture

### 1. Game Engine

* Điều khiển game loop
* Cập nhật trạng thái

### 2. Input Handler

* Nhận input bàn phím
* Xử lý sự kiện

### 3. Maze Module

* Lưu trữ mê cung
* Kiểm tra va chạm

### 4. Pathfinding Module

* BFS / DFS / A*

### 5. Renderer

* Hiển thị game

---

## 🔁 Game Flow

1. Khởi tạo mê cung
2. Đặt player
3. Nhận input
4. Kiểm tra hợp lệ
5. Di chuyển
6. Kiểm tra win
7. Lặp lại

---

## 🖥 Interface

### 🎨 Display

* Grid-based maze
* Player & Goal rõ ràng

---

### 🎮 Controls

| Key   | Action     |
| ----- | ---------- |
| W / ↑ | Move Up    |
| S / ↓ | Move Down  |
| A / ← | Move Left  |
| D / → | Move Right |

---

## 📊 Features

* ✔️ Di chuyển nhân vật
* ✔️ Va chạm tường
* ✔️ Win condition
* ✔️ Pathfinding
* ✔️ Random maze (optional)

---

## 🚀 Installation

### Clone project

```bash
git clone <your-repo>
cd MazeGame
```

---

### Install dependencies

```bash
pip install -r requirements.txt
```

---

### Run game

```bash
python main.py
```

---

## 🧪 Example

```
##########
#S   #   #
# ## # # #
#    #  G#
##########
```

---

## 🏆 Results

* Game hoạt động ổn định
* Điều khiển mượt
* Thuật toán chính xác

---

## 🚧 Future Work

* GUI bằng PyGame
* Animation
* Multiple levels
* AI auto-solve
* Save / Load

---

## 🧾 Conclusion

Dự án giúp hiểu rõ:

* Thuật toán tìm đường
* Game development cơ bản
* Xử lý input

---

## 👨‍💻 Author

* NGUYEN TIEN DUNG
* Python Project

---

## ⭐ Note

Phù hợp cho:

* Bài tập lập trình
* Demo thuật toán
* Portfolio cá nhân
