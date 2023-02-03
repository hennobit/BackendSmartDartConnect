import { Socket } from 'socket.io';
import { Player } from './player';
import { globalGameMap, globalPlayerMap, handleGameRooms } from '../utils/sessionmanager';

interface GameStart {
    roomId: string;
}

export interface Game {
    roomId: string;
    players: Player[];
    currentPlayer: Player;
    dartsLeft: number;
}

interface DartThrow {
    roomId: string;
    playerId: string;
    points: 0;
}

export function startGame(socket: Socket, json: string): void {
    const gameStart: GameStart = JSON.parse(json);
    let players: Player[] = globalPlayerMap.get(gameStart.roomId);

    const game: Game = {
        roomId: gameStart.roomId,
        players: players,
        currentPlayer: players[0],
        dartsLeft: 3
    };
    console.log(`Es wurde ein Game in Raum ${game.roomId} gestartet mit den Spielern: ${game.players.map((p: Player) => p.name)}. ${game.currentPlayer.name} fängt an.`)
    handleGameRooms(socket, game);
}

export function dartThrown(socket: Socket, json: string): void {
    const dartThrow: DartThrow = JSON.parse(json);
    const game: Game = globalGameMap.get(dartThrow.roomId);
    let playerInRoomArray: Player[] = game.players;
    let player: Player | undefined = playerInRoomArray.find((p: Player) => p.socket === dartThrow.playerId)
    
    if (player === undefined) {
        console.log(`Error in Raum ${dartThrow.roomId}! Spieler mit der SocketID ${dartThrow.playerId} nicht gefunden.`)
        return;
    }

    player.pointsLeft -= dartThrow.points;
    game.dartsLeft -= 1;

    if (game.dartsLeft === 0) {
        let currentPlayerIndex = game.players.indexOf(game.currentPlayer);
        currentPlayerIndex++;
        if (currentPlayerIndex >= game.players.length) {
            currentPlayerIndex = 0;
        }
        game.currentPlayer = game.players[currentPlayerIndex];
        game.dartsLeft = 3;
    }
    console.log(`${dartThrow.points} geworfen von ${player.name} in Raum ${game.roomId}. ${player.pointsLeft} Punkte verbleiben...`)
    socket.to(dartThrow.roomId).emit('dart-throw', JSON.stringify(game));
}
