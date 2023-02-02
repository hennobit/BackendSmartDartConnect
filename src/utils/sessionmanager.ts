import { Player } from "../interfaces/player";

let globalGameMap = new Map();

// ich hab kein bock mehr  das hier zu teesten, mache ich ein anderes mal
export function handlePlayerCount(room: string, player: Player, io: any): void {
    if (room == undefined || player == undefined) {
        return;
    }
    console.log("geile sache man kommt wenigstens rein")
    // map von aktuellen sockets in room
    const freshMap = io.sockets.adapter.rooms;
    const freshRoomContent = Array.from(freshMap.get(room));

    let actualPlayers = [];

    // wenn die globalGameMap schon den "room" kennt, dann einfach nur die spieleranzahl aktualisieren
    if (globalGameMap.has(room)) {
        // aktuelle players die die globalGameMap kennt
        let players = globalGameMap.get(room);
        players.push(player);
        // hier werden die tatsächlichen spieler aus der aktuellen socket mit den spielern aus der gameMap verglichen. wenn die gameMap einen spieler
        // beinhaltet, den der aktuelle socket nicht kennt, wird dieser rausgeschmissen...
        actualPlayers = players.filter((p: any) => freshRoomContent.includes(p.name));
        //  ... und die globalGameMap aktualisiert
        globalGameMap.set(room, actualPlayers);
    } else {
        // wenn die globalGameMap den room noch nicht kennt, wird ein array mit dem spieler erstellt, der den raum initiert hat. der raum wird inklusive spieler
        // der globalGameMap übergeben und der spieler wird zum host gemacht
        player.host = true
        actualPlayers = [player];
        globalGameMap.set(room, actualPlayers);
    }
    io.to(room).emit("playercount-change", actualPlayers);
}