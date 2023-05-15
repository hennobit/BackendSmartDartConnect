import { Server, Socket } from 'socket.io';
import { startGame, dartThrown, nextPlayerEvent } from './interfaces/game';
import { joinRoom, leaveRoom } from './interfaces/player';
import app from './database';

import { createServer } from 'http';
import * as fs from 'fs';
const privateKey = fs.readFileSync("/etc/ssl/private/dasistdart_private.key", "utf-8")
const certificate = fs.readFileSync("/etc/ssl/certs/dasistdart_certificate.crt" , "utf-8")
const credentials = {key: privateKey, cert: certificate}

const PORT: number = 8081;
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
    allowEIO3: true,
    pingTimeout: 2000,
    pingInterval: 1000
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

server.listen(PORT, () => {
    console.log('Server läuft auf ' + PORT);
});
