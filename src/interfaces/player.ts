import { Server, Socket } from 'socket.io';
import { handlePlayerCount } from '../utils/sessionmanager';

export interface Player {
    name: string,
    pointsLeft: number,
    host: boolean,
    socket: string
}

interface JoinRoom {
    roomId: string;
    oldRoom: string;
    player: Player;
}

export function joinRoom(io: Server, socket: Socket, json: string): void {
    const joinRoomObject: JoinRoom = JSON.parse(json);
    socket.join(joinRoomObject.roomId);
    socket.leave(joinRoomObject.oldRoom);
    console.log(
        `Spieler ${joinRoomObject.player.name} ist dem Raum ${joinRoomObject.roomId} beigetreten`
    );
    handlePlayerCount(joinRoomObject.roomId, joinRoomObject.player, io);
}

export function leaveRoom(socket: Socket): void {
    console.log(`${socket.id} disconnected`);
}
