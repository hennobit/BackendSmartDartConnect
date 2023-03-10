import { Server, Socket } from 'socket.io';
import { deleteRoomIfEmpty, globalPlayerMap, handlePlayerCount } from '../utils/sessionmanager';

export interface Player {
    name: string;
    pointsLeft: number;
    host: boolean;
    socket: string;
    lastThrows: number[];
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

    console.log(socket.rooms)
    console.log(`Spieler ${joinRoomObject.player.name} tritt dem Raum ${joinRoomObject.roomId} bei...`);

    handlePlayerCount(joinRoomObject.roomId, joinRoomObject.player, io, oldRoom);
}

export function leaveRoom(socket: Socket): void {
    const room: string = [...socket.rooms][0];
    let playerArrayInRoom: Player[] | undefined = globalPlayerMap.get(room);
    console.log(`${socket.id} is disconnecting`, `${playerArrayInRoom ? "and leaves Room: " + room : "..."}`);
    if (playerArrayInRoom === undefined) {
        // wenn wir hier drinne landen, ist die socket in keinem raum drinne und wir können returnen
        return;
    }
    const actualPlayersInRoom = playerArrayInRoom.filter((p) => p.socket !== socket.id);
    socket.to(room).emit('playercount-change', JSON.stringify(actualPlayersInRoom));

    globalPlayerMap.set(room, actualPlayersInRoom)
    deleteRoomIfEmpty(room);
}
