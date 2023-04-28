import { Server, Socket } from "socket.io";
import { Game } from "../interfaces/game";
import { Player } from "../interfaces/player";
import { Endingmode } from "../gamemodes/endingmodes";

export let globalPlayerMap = new Map();
export let globalGameMap = new Map();

export function handlePlayerCount(
    room: string,
    player: Player,
    io: Server,
    oldRoom?: string
): void {
    if (room == undefined || player == undefined) {
        return;
    }
    // map von aktuellen sockets in room
    const freshMap: Map<string, Set<string>> = io.sockets.adapter.rooms;
    const freshRoom: Set<string> | undefined = freshMap.get(room);

    if (freshRoom == undefined) {
        console.log("Fehler beim auslesen der Spieler!!!");
        return;
    }

    const freshRoomArray: string[] = Array.from(freshRoom);

    let actualPlayers: Player[] = [];

    // wenn die globalPlayerMap schon den "room" kennt, dann einfach nur die spieleranzahl aktualisieren
    if (globalPlayerMap.has(room)) {
        // aktuelle players die die globalGameMap kennt
        let players: Player[] = globalPlayerMap.get(room);

        if (players.length >= 16) {
            console.log(
                `Maximale Anzahl der Spieler in Raum ${room} erreicht!`
            );
            return;
        }

        const game: Game = globalGameMap.get(room);
        if (game && game.running) {
            console.log(`${player.name} versuchte einem laufendem Spiel (${room}) beizutreten!`)
            return;
        }

        for (let i = 0; i < players.length; i++) {
            if (players[i].socket === player.socket) {
                console.log(
                    `${player.name} existiert bereits mit der SocketID ${player.socket} in Raum ${room}`
                );
                return; // nicht erlauben nochmal zu joinen
            }
        }

        players.push(player);
        // hier werden die tatsächlichen spieler aus der aktuellen socket mit den spielern aus der gameMap verglichen. wenn die gameMap einen spieler
        // beinhaltet, den der aktuelle socket nicht kennt, wird dieser rausgeschmissen...
        actualPlayers = players.filter((p: Player) =>
            freshRoomArray.includes(p.socket)
        );

        //  ... und die globalGameMap aktualisiert
        globalPlayerMap.set(room, actualPlayers);
    } else {
        // wenn die globalGameMap den room noch nicht kennt, wird ein array mit dem spieler erstellt, der den raum initiert hat. der raum wird inklusive spieler
        // der globalGameMap übergeben und der spieler wird zum host gemacht
        player.host = true;
        actualPlayers = [player];
        globalPlayerMap.set(room, actualPlayers);
    }

    if (oldRoom && oldRoom !== room && globalPlayerMap.has(oldRoom)) {
        const oldRoomPlayers: Player[] = globalPlayerMap.get(oldRoom);
        globalPlayerMap.delete(oldRoom);

        // emit event to old room that the player left
        io.to(oldRoom).emit(
            "playercount-change",
            oldRoomPlayers.filter((p) => p.socket !== player.socket)
        );
    }

    io.to(room).emit("playercount-change", actualPlayers);
}

export function handleGameRooms(socket: Socket, game: Game): void {
    globalGameMap.set(game.roomId, game);
    console.log(
        `Es wurde ein Game in Raum ${
            game.roomId
        } gestartet mit den Spielern: ${game.players.map(
            (p: Player) => p.name
        )}. ${game.currentPlayer.name} fängt an. Es gilt ${game.currentPlayer.pointsLeft} Punkte zu werfen im ${Endingmode[game.endingmode]} Modus!`
    );
    socket.to(game.roomId).emit("start-game", game);
}

export function deleteRoomIfEmpty(room: string) {
    if (globalPlayerMap.get(room).length <= 0) {
        console.log(`Raum ${room} ist leer und wird gelöscht!`);
        globalGameMap.delete(room);
    }
}
