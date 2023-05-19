import { Server, Socket } from 'socket.io';
import { deleteRoomIfEmpty, globalPlayerMap, handlePlayerCount } from '../utils/sessionmanager';
import { RANDOM_SOCKET } from '../server';
import { insertSocketId } from '../database';

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
        console.log(err);
    }
    if (!joinRoomObject) {
        console.log('Join-Room JSON kaputt');
        return;
    }
    const oldRoom = [...socket.rooms][0];
    socket.leave(oldRoom);
    socket.join(joinRoomObject.roomId);

    console.log(socket.rooms);
    console.log(`Spieler ${joinRoomObject.player.name} tritt dem Raum ${joinRoomObject.roomId} bei...`);

    handlePlayerCount(joinRoomObject.roomId, joinRoomObject.player, io, oldRoom);
}

export function leaveRoom(socket: Socket): void {
    const room: string = [...socket.rooms][0];
    const playerArrayInRoom: Player[] | undefined = globalPlayerMap.get(room);
    console.log(`${socket.id} is disconnecting`, `${playerArrayInRoom ? 'and leaves Room: ' + room : '...'}`);
    if (playerArrayInRoom === undefined) {
        // wenn wir hier drinne landen, ist die socket in keinem raum drinne und wir können returnen
        return;
    }
    const actualPlayersInRoom = playerArrayInRoom.filter((p) => p.socket !== socket.id);
    socket.to(room).emit('playercount-change', JSON.stringify(actualPlayersInRoom));

    globalPlayerMap.set(room, actualPlayersInRoom);
    deleteRoomIfEmpty(room);
}

// ok das muss man sich auf jeden fall nochmal angucken, hab mir jetzt erstmal gedacht, dass es 
// egal ist, welche socket jetzt die information schickt, dass player x online ist
export function sendPlayerOnline(userId: number, friendSocketId: string) {
    RANDOM_SOCKET.to(friendSocketId).emit('friend-online', { userId: userId });
}
