import { Server, Socket } from 'socket.io';
import { Game } from '../interfaces/game';
import { Player } from '../interfaces/player';

export let globalPlayerMap = new Map();
export let globalGameMap = new Map();

export function handlePlayerCount(room: string, player: Player, io: Server): void {
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
    if (globalPlayerMap.has(room)) {
        // aktuelle players die die globalGameMap kennt
        let players: Player[] = globalPlayerMap.get(room);
        players.push(player);
        // hier werden die tatsächlichen spieler aus der aktuellen socket mit den spielern aus der gameMap verglichen. wenn die gameMap einen spieler
        // beinhaltet, den der aktuelle socket nicht kennt, wird dieser rausgeschmissen...
        actualPlayers = players.filter((p: Player) => freshRoomArray.includes(p.socket));

        //  ... und die globalGameMap aktualisiert
        globalPlayerMap.set(room, actualPlayers);
    } else {
        // wenn die globalGameMap den room noch nicht kennt, wird ein array mit dem spieler erstellt, der den raum initiert hat. der raum wird inklusive spieler
        // der globalGameMap übergeben und der spieler wird zum host gemacht
        player.host = true;
        actualPlayers = [player];
        globalPlayerMap.set(room, actualPlayers);
    }
    io.to(room).emit('playercount-change', actualPlayers);
}

export function handleGameRooms(socket: Socket, game: Game): void {
    if (globalGameMap.has(game.roomId)) {
        // also erstmal kann der server den raum ja gar nicht haben deswegen hier einfach nur nen fehler schmeißen
        console.log('Fehler beim starten des Spiels. Spiel läuft bereits!');
        return;
    }
    globalGameMap.set(game.roomId, game);
    console.log(
        `Es wurde ein Game in Raum ${game.roomId} gestartet mit den Spielern: ${game.players.map(
            (p: Player) => p.name
        )}. ${game.currentPlayer.name} fängt an.`
    );
    socket.to(game.roomId).emit("start-game", JSON.stringify(game))
}
