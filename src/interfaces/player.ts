import { Server } from "socket.io";
import { handlePlayerCount } from "../utils/sessionmanager";

export interface Player {
    name: string,
    pointsLeft: number,
    host: boolean
  }

interface JoinRoom {
        roomId: string,
        oldRoom: string,
        player: Player
}

export function joinRoom(io: Server, json: string): void {
    const joinRoomObject: JoinRoom = JSON.parse(json);
    console.log(`Spieler ${joinRoomObject.player.name} ist dem Raum ${joinRoomObject.roomId} beigetreten`)
    handlePlayerCount(joinRoomObject.roomId, joinRoomObject.player, io)
}