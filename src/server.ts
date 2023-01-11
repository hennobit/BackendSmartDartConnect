import { createServer } from "http";
import { Server } from "socket.io";
import express, { Request, Response } from "express";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

app.get("/throw", (req: Request, res: Response) => {
    res.send("" + Math.floor(Math.random() * 61));
});

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    socket.on("ping", () => {
        socket.emit("pong", "Das Event wurde getriggert :)")
    })

    socket.on("join-room", (room: string) => {
        socket.join(room);
        console.log(`${socket.id} joined ${room}`);
    });

    socket.on("dart-throw", (room: string, player: number, points: number) => {
        io.to(room).emit("dart-throw", player, points);
    });
});

httpServer.listen(8081, () => {
    console.log("Server läuft auf 8081");
});
