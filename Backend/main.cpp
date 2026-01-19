#define _WIN32_WINNT 0x0A00
#include <iostream>
#include <string>  // For stoi
#include <stdexcept>  // For try-catch stoi
#include "third_party/httplib.h"
#include "maze/Maze.h"
#include "Algorithms/DFS.h"
#include "Algorithms/BFS.h"
#include "Algorithms/AStar.h"
#include "Player/player.h"

using namespace std;

int main() {
    httplib::Server svr;

    auto cors = [](httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
    };

    // Generate maze (thêm limit difficulty)
    svr.Get("/generateMaze", [&](auto& req, auto& res){
        int d = 25;  // Default
        if (req.has_param("difficulty")) {
            try {
                d = stoi(req.get_param_value("difficulty"));
                if (d < 10 || d > 50) d = 25;  // Limit to reasonable size
            } catch (const std::exception& e) {
                printf("Error: Invalid difficulty '%s'\n", req.get_param_value("difficulty").c_str());
            }
        }
        generateMaze(d);
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    // Set custom start position (thêm error handling)
    svr.Get("/setStart", [&](auto& req, auto& res){
        if (req.has_param("x") && req.has_param("y")) {
            try {
                int x = stoi(req.get_param_value("x"));
                int y = stoi(req.get_param_value("y"));
                setStartCell(x, y);
            } catch (const std::exception& e) {
                printf("Error: Invalid start position '%s,%s'\n", 
                       req.get_param_value("x").c_str(), req.get_param_value("y").c_str());
            }
        }
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    // Set custom goal position (tương tự)
    svr.Get("/setGoal", [&](auto& req, auto& res){
        if (req.has_param("x") && req.has_param("y")) {
            try {
                int x = stoi(req.get_param_value("x"));
                int y = stoi(req.get_param_value("y"));
                setGoalCell(x, y);
            } catch (const std::exception& e) {
                printf("Error: Invalid goal position '%s,%s'\n", 
                       req.get_param_value("x").c_str(), req.get_param_value("y").c_str());
            }
        }
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    // Step endpoints: Đã tốt, thêm debug log
    svr.Get("/stepDFS", [&](auto&, auto& res){
        printf("DEBUG: /stepDFS called, pathFound=%d, running=%d\n", pathFound, running);  // Debug
        if (pathFound) {
            cors(res);
            res.set_content(mazeToJson().dump(), "application/json");
            return;
        }
        if (!running) startDFS();
        stepDFS();
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/stepBFS", [&](auto&, auto& res){
        printf("DEBUG: /stepBFS called, pathFound=%d, running=%d\n", pathFound, running);
        if (pathFound) {
            cors(res);
            res.set_content(mazeToJson().dump(), "application/json");
            return;
        }
        if (!running) startBFS();
        stepBFS();
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/stepAStar", [&](auto&, auto& res){
        printf("DEBUG: /stepAStar called, pathFound=%d, running=%d\n", pathFound, running);  // Quan trọng cho debug vấn đề của bạn
        if (pathFound) {
            cors(res);
            res.set_content(mazeToJson().dump(), "application/json");
            return;
        }
        if (!running) startAStar();
        stepAStar();
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    // Reset endpoint: Tốt, thêm check
    svr.Get("/resetAlgoState", [&](auto&, auto& res){
        resetMaze();
        running = false;
        pathFound = false;
        // Clear openSet nếu global (từ AStar.cpp), nhưng assume resetMaze() handle
        printf("Server: Algo state reset. running=%d, pathFound=%d\n", running, pathFound);
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/playerMove", [&](auto& req, auto& res){
        if (req.has_param("dir")) {
            movePlayer(req.get_param_value("dir"));
        }
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    cout << "Server running at http://localhost:8080\n";
    svr.listen("localhost", 8080);
    return 0;
}