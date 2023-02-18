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
    nextPlayer: Player;
    dartsLeft: number;
}

interface DartThrow {
    roomId: string;
    playerId: string;
    points: number;
    multiplikator: number;
}

export function startGame(socket: Socket, json: string): void {
    let gameStart: GameStart | undefined = undefined;
    gameStart = JSON.parse(json);
    if (!gameStart) {
        console.log('Start-Game JSON kaputt');
        return;
    }
    console.log(gameStart);
    let players: Player[] = globalPlayerMap.get(gameStart.roomId);
    console.log();
    const game: Game = {
        roomId: gameStart.roomId,
        players: players,
        currentPlayer: players[0],
        nextPlayer: players[1] ? players[1] : players[0],
        dartsLeft: 3
    };
    handleGameRooms(socket, game);
}

export function dartThrown(socket: Socket, json: string): void {
    let dartThrow: DartThrow | undefined = undefined;
    try {
        dartThrow = JSON.parse(json);
    } catch (err) {
        console.log(err);
    }
    if (!dartThrow) {
        console.log('Dart-Throw JSON kaputt');
        return;
    }
    let game: Game = globalGameMap.get(dartThrow.roomId);
    let playerInRoomArray: Player[] = game.players;
    let player: Player | undefined = playerInRoomArray.find((p: Player) => p.socket === dartThrow?.playerId);

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

    player.pointsLeft -= dartThrow.points * dartThrow.multiplikator;
    game.dartsLeft -= 1;

    if (isGameOver(socket, player, game)) {
        return;
    }

    if (game.dartsLeft === 0) {
        game = nextTurn(game);
    }
    console.log(
        `${dartThrow.points * dartThrow.multiplikator} geworfen von ${player.name} in Raum ${game.roomId}. ${player.pointsLeft} Punkte verbleiben...`
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
    currentPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
    game.currentPlayer = game.players[currentPlayerIndex];
    game.nextPlayer = game.players[(currentPlayerIndex + 1) % game.players.length];
    game.dartsLeft = 3;
    return game;
}

function isGameOver(socket: Socket, player: Player, game: Game): boolean {
    if (player.pointsLeft === 0) {
        socket.to(game.roomId).emit('game-over', game);
        console.log(`${player.name} hat in Raum ${game.roomId} gewonnen! GG`);
        return true;
    }
    return false;
}
