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
    handleGameRooms(socket, game);
}

export function dartThrown(socket: Socket, json: string): void {
    const dartThrow: DartThrow = JSON.parse(json);
    let game: Game = globalGameMap.get(dartThrow.roomId);
    let playerInRoomArray: Player[] = game.players;
    let player: Player | undefined = playerInRoomArray.find((p: Player) => p.socket === dartThrow.playerId);

    if (player === undefined) {
        console.log(
            `Error in Raum ${dartThrow.roomId}! Spieler mit der SocketID ${dartThrow.playerId} nicht gefunden.`
        );
        return;
    }

    if (!isLegalThrow(player, dartThrow)) {
        handleIllegalThrow(socket, player, game);
        return;
    }

    player.pointsLeft -= dartThrow.points;
    game.dartsLeft -= 1;
    
    if (isGameOver(socket, player, game)) {
        return;
    }

    if (game.dartsLeft === 0) {
        game = nextTurn(game);
    }
    console.log(
        `${dartThrow.points} geworfen von ${player.name} in Raum ${game.roomId}. ${player.pointsLeft} Punkte verbleiben...`
    );
    socket.to(game.roomId).emit('dart-throw', JSON.stringify(game));
}

function isLegalThrow(player: Player, dartThrow: DartThrow): boolean {
    if (player.pointsLeft - dartThrow.points < 0) {
        return false;
    }
    return true;
}

function handleIllegalThrow(socket: Socket, player: Player, game: Game): void {
    game.dartsLeft = 0;
    console.log(`${game.currentPlayer.name} hat in ${game.roomId} über 0 geworfen`);
    console.log(`Er bleibt bei ${player.pointsLeft} Punkten. Nächster`);
    socket.to(game.roomId).emit('dart-throw', JSON.stringify(game));
}

function nextTurn(game: Game): Game {
    let currentPlayerIndex = game.players.indexOf(game.currentPlayer);
    currentPlayerIndex++;
    if (currentPlayerIndex >= game.players.length) {
        currentPlayerIndex = 0;
    }
    game.currentPlayer = game.players[currentPlayerIndex];
    game.dartsLeft = 3;
    return game;
}

function isGameOver(socket: Socket, player: Player, game: Game): boolean {
    if (player.pointsLeft === 0) {
        socket.to(game.roomId).emit("game-over", game)
        console.log(`${player.name} hat in Raum ${game.roomId} gewonnen! GG`)
        return true;
    }
    return false;
}
