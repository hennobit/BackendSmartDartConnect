import { Server, Socket } from 'socket.io';
import express, { Request, Response } from 'express';
import { startGame, dartThrown, nextPlayerEvent } from './interfaces/game';
import { joinRoom, leaveRoom } from './interfaces/player';

import { createServer } from 'https';
import * as fs from 'fs';
const privateKey = fs.readFileSync("/etc/ssl/private/dasistdart_private.key", "utf-8")
const certificate = fs.readFileSync("/etc/ssl/certs/dasistdart_certificate.crt" , "utf-8")
const credentials = {key: privateKey, cert: certificate}

const app = express();
const server = createServer(credentials, app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
    allowEIO3: true,
    pingTimeout: 2000,
    pingInterval: 1000
});

app.get('/throw', (req: Request, res: Response) => {
    res.send('' + Math.floor(Math.random() * 61));
});

app.get('/log', (req: Request, res: Response) => {
    res.sendFile('/server_log.txt');
});

io.on('connection', (socket: Socket) => {
    console.log(`${socket.id} connected`);

    socket.on('disconnecting', () => {
        leaveRoom(socket);
    });

    socket.on('leave-room', () => {
        leaveRoom(socket);
    });

    socket.on('join-room', (json: string) => {
        joinRoom(io, socket, json);
    });

    socket.on('dart-throw', (json: string) => {
        dartThrown(socket, json);
    });

    socket.on('start-game', (json: string) => {
        startGame(socket, json);
    });

    socket.on('next-player', (json: string) => {
        nextPlayerEvent(socket, json);
    });
});

server.listen(8081, () => {
    console.log('Server läuft auf 8081');
});
