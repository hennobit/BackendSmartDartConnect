import { Socket } from 'socket.io';
import { Player } from './player';
import { globalGameMap, globalPlayerMap, handleGameRooms } from '../utils/sessionmanager';
import { Endingmode, Gamemode } from '../enums/enums';

interface GameStart {
    roomId: string;
    points: number;
    endingmode: Endingmode;
    gamemode: Gamemode;
}

export interface Game {
    roomId: string;
    players: Player[];
    currentPlayer: Player;
    nextPlayer: Player;
    dartsLeft: number;
    running: boolean;
    finishOrder: Player[];
    endingmode: Endingmode,
    gamemode: Gamemode
}

export interface DartThrow {
    roomId: string;
    player: Player;
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

    let players: Player[] = globalPlayerMap.get(gameStart.roomId);
    if (!players) {
        console.log(
            `Es existiert kein aktives Spiel mit Spielern in Raum ${gameStart.roomId}! Wurde das Spiel gestartet?`
        );
        return;
    }

    const room: Game = globalGameMap.get(gameStart.roomId);
    if (room && room.running) {
        console.log('Fehler beim starten des Spiels. Spiel läuft bereits!');
        return;
    }

    for (let i = 0; i < players.length; i++) {
        players[i].pointsLeft = gameStart.points;
    }
    const game: Game = {
        roomId: gameStart.roomId,
        players: players,
        currentPlayer: players[0],
        nextPlayer: players[1] ? players[1] : players[0],
        dartsLeft: 3,
        running: true,
        finishOrder: [],
        endingmode: gameStart.endingmode,
        gamemode: gameStart.gamemode
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
    console.log("Dart has been thrown");

    socket.to(dartThrow.roomId).emit('dart-throw', dartThrow)
    return;
}

export function nextPlayerEvent(socket: Socket, roomId: string) {
    const game: Game = globalGameMap.get(roomId);
    console.log(`Es wurde der nächste Player geforced! ${game.currentPlayer.name} zu ${game.nextPlayer.name}`)
    for (let i = 0; i < game.dartsLeft; i++) {
        game.currentPlayer.lastThrows.push(0)
    }
    socket.to(roomId).emit('next-player', JSON.stringify(rotatePlayers(game)))
}

function rotatePlayers(game: Game): Game {
    // den index des jetztigen players finden 
    const currentPlayerIndex = game.players.indexOf(game.currentPlayer);
    
    // der nächste current player, der noch Punkte hat
    let nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
    while (game.players[nextPlayerIndex].pointsLeft === 0) {
        nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
    }
    game.currentPlayer = game.players[nextPlayerIndex];
    
    // der nächste nextPlayer, der noch Punkte hat, überspringt den aktuellen currentPlayer
    let nextNextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
    while (game.players[nextNextPlayerIndex].pointsLeft === 0) {
        nextNextPlayerIndex = (nextNextPlayerIndex + 1) % game.players.length;
        if (nextNextPlayerIndex === nextPlayerIndex) { // alle Spieler haben 0 Punkte sollte aber schon mit isGameOver() gecovered sein. Hier einfach nur loggen
            console.log(`Alle Spieler in Raum ${game.roomId} haben keine Punkte mehr! Das sollte hier aber nicht passieren!`)
            return game;
        }
    }
    game.nextPlayer = game.players[nextNextPlayerIndex];
    
    game.dartsLeft = 3;
    return game;
}
