import { Server, Socket } from 'socket.io';
import { globalPlayerMap, handlePlayerCount } from '../utils/sessionmanager';

export interface Player {
    name: string;
    pointsLeft: number;
    host: boolean;
    socket: string;
}

interface JoinRoom {
    roomId: string;
    player: Player;
}

export function joinRoom(io: Server, socket: Socket, json: string): void {
    let joinRoomObject: JoinRoom | undefined = undefined; 
    try {
        joinRoomObject = JSON.parse(json);
    } catch (err) {
        console.log(err)
    }
    if (!joinRoomObject) {
        console.log("Join-Room JSON kaputt")
        return;
    }
    const oldRoom = [...socket.rooms][0];
    socket.leave(oldRoom);
    socket.join(joinRoomObject.roomId);
    //socket.leave;
    console.log(`Spieler ${joinRoomObject.player.name} ist dem Raum ${joinRoomObject.roomId} beigetreten`);
    console.log(socket.rooms);
    handlePlayerCount(joinRoomObject.roomId, joinRoomObject.player, io, oldRoom);
}

export function leaveRoom(socket: Socket): void {
    const room: string = [...socket.rooms][0];
    let playerArrayInRoom: Player[] | undefined = globalPlayerMap.get(room);
    if (playerArrayInRoom === undefined) {
        console.log(`Fehler in Raum ${room}. Es konnten keine Spieler gefunden werden`);
        return;
    }
    const actualPlayersInRoom = playerArrayInRoom.filter((p) => p.socket !== socket.id);
    console.log(`${socket.id} disconnecting...`);
    socket.to(room).emit('playercount-change', actualPlayersInRoom);
}
