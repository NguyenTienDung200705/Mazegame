#define _WIN32_WINNT 0x0A00
#include <iostream>
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

    svr.Get("/generateMaze", [&](auto& req, auto& res){
        int d = req.has_param("difficulty") ? stoi(req.get_param_value("difficulty")) : 25;
        generateMaze(d);
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/stepDFS", [&](auto&, auto& res){
        if (!running) startDFS();
        stepDFS();
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/stepBFS", [&](auto&, auto& res){
        if (!running) startBFS();
        stepBFS();
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/stepAStar", [&](auto&, auto& res){
        if (!running) startAStar();
        stepAStar();
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    svr.Get("/playerMove", [&](auto& req, auto& res){
        if (req.has_param("dir")) movePlayer(req.get_param_value("dir"));
        cors(res);
        res.set_content(mazeToJson().dump(), "application/json");
    });

    cout << "Server running at http://localhost:8080\n";
    svr.listen("localhost", 8080);
}
