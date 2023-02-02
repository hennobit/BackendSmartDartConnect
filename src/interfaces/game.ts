import { Socket } from "socket.io";
import { Player } from "./player";

interface GameStart {
    roomId: string;
}

interface Game {
    roomId: string;
    players: Player[];
    currentPlayer: Player;
    dartsLeft: number;
}

interface DartThrow {
    roomId: string;
    player: Player;
    points: 0;
}

export function startGame(socket: Socket, json: string): void {
    let players: Player[] = [];
    
    const gameStart: GameStart = JSON.parse(json);
    const game: Game = {
        roomId: gameStart.roomId,
        players: players,
        currentPlayer: players[0],
        dartsLeft: 3,
    };
    console.log(`In Raum ${game.roomId} wurde ein Spiel gestartet!`)
    socket.to(game.roomId).emit('start-game');
}

export function dartThrown(socket: Socket, json: string): void {
    const dartThrow: DartThrow = JSON.parse(json);
    console.log(`Player: ${dartThrow.player.name} hat ${dartThrow.points} Punkte in Raum ${dartThrow.roomId} geworfen!`)
    console.log(`Jetzt muss er noch ${dartThrow.player.pointsLeft - dartThrow.points} werfen`)
    socket.to(dartThrow.roomId).emit("dart-throw", dartThrow.player, dartThrow.points);
}
