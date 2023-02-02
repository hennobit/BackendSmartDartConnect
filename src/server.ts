import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express, { Request, Response } from "express";
import { startGame, dartThrown } from "./interfaces/game";
import { joinRoom } from "./interfaces/player";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

app.get("/throw", (req: Request, res: Response) => {
    res.send("" + Math.floor(Math.random() * 61));
});

io.on("connection", (socket: Socket) => {
    console.log(`${socket.id} connected`);
    
    socket.on("join-room", (json: string) => {
        joinRoom(io, json);
    });

    socket.on("dart-throw", (json: string) => {
        dartThrown(socket, json);
    });

    socket.on("start-game", (json: string) => {
        startGame(socket, json);
    });
});

httpServer.listen(8081, () => {
    console.log("Server läuft auf 8081");
});
