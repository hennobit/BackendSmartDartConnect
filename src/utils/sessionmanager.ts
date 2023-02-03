import { Server } from 'socket.io';
import { Player } from '../interfaces/player';

export let globalGameMap = new Map();

// ich hab kein bock mehr  das hier zu teesten, mache ich ein anderes mal
export function handlePlayerCount(
    room: string,
    player: Player,
    io: Server
): void {
    if (room == undefined || player == undefined) {
        return;
    }
    // map von aktuellen sockets in room
    const freshMap: Map<string, Set<string>> = io.sockets.adapter.rooms;
    const freshRoom: Set<string> | undefined = freshMap.get(room);

    if (freshRoom == undefined) {
        console.log('Fehler beim auslesen der Spieler!!!');
        return;
    }

    const freshRoomArray: string[] = Array.from(freshRoom);

    let actualPlayers: Player[] = [];

    // wenn die globalGameMap schon den "room" kennt, dann einfach nur die spieleranzahl aktualisieren
    if (globalGameMap.has(room)) {
        // aktuelle players die die globalGameMap kennt
        let players: Player[] = globalGameMap.get(room);
        players.push(player);
        // hier werden die tatsächlichen spieler aus der aktuellen socket mit den spielern aus der gameMap verglichen. wenn die gameMap einen spieler
        // beinhaltet, den der aktuelle socket nicht kennt, wird dieser rausgeschmissen...
        actualPlayers = players.filter((p: Player) =>
            freshRoomArray.includes(p.socket)
        );

        //  ... und die globalGameMap aktualisiert
        globalGameMap.set(room, actualPlayers);
    } else {
        // wenn die globalGameMap den room noch nicht kennt, wird ein array mit dem spieler erstellt, der den raum initiert hat. der raum wird inklusive spieler
        // der globalGameMap übergeben und der spieler wird zum host gemacht
        player.host = true;
        actualPlayers = [player];
        globalGameMap.set(room, actualPlayers);
    }
    io.to(room).emit('playercount-change', actualPlayers);
}
