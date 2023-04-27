import { Socket } from 'socket.io';
import { Player } from './player';
import { globalGameMap, globalPlayerMap, handleGameRooms } from '../utils/sessionmanager';
import { Gamemode, gamemodeNames } from '../gamemodes/gamemodes';

interface GameStart {
    roomId: string;
    points: number;
    gamemode: number;
}

export interface Game {
    roomId: string;
    players: Player[];
    currentPlayer: Player;
    nextPlayer: Player;
    dartsLeft: number;
    running: boolean;
    finishOrder: Player[];
    gamemode: number
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

    socket.to(dartThrow.roomId).emit('dart-throw', json)
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

function handleIllegalThrow(socket: Socket, player: Player, game: Game): void {
    const lastNumbers: number[] = player.lastThrows.slice(Math.max(player.lastThrows.length - (3 - game.dartsLeft), 0));
    const pointsToAdd: number = lastNumbers.reduce((a, b) => a + b, 0);
    player.pointsLeft += pointsToAdd;
    game = rotatePlayers(game);
    console.log(`${game.currentPlayer.name} hat in ${game.roomId} keinen gültigen Endwurf geworfen. Spielmodus ${gamemodeNames[game.gamemode]}`);
    console.log(`Er bleibt bei ${player.pointsLeft} Punkten. Nächster`);
    socket.to(game.roomId).emit('dart-throw', JSON.stringify(game));
}

function isLegalThrow(dartThrow: DartThrow, player: Player, game: Game): boolean {
    const pointsLeft: number = player.pointsLeft - dartThrow.points * dartThrow.multiplikator;
    console.log(pointsLeft)

    if (game.gamemode == Gamemode.STRAIGHT_OUT) {
        return pointsLeft >= 0;
    }
    if (game.gamemode == Gamemode.DOUBLE_OUT) {
        // beim double out darf man nicht auf 1 stehen bleiben
        if (pointsLeft >= 2) {
            return true;
        }
        return pointsLeft == 0 && dartThrow.multiplikator == 2;
    }

    console.log("Warum sind wir hier gelandet? Error in isLegalThrow()")
    return false;
}

function isGameOver(socket: Socket, game: Game): boolean {
    // Game Over soll jetzt nur noch getriggert werden, wenn nur noch EIN Spieler in einem Raum seine Punkte noch nicht runtergeworfen hat
    const playersWithPointsLeft: number = game.players.filter((p) => p.pointsLeft > 0).length;
    if (playersWithPointsLeft <= 1) {
        game.running = false;
        socket.to(game.roomId).emit('game-over', game);
        console.log(`${game.finishOrder[0].name} hat in Raum ${game.roomId} gewonnen! GG`);
        return true;
    }
    return false;
}

function updateFinishOrder(player: Player, game: Game): Game {
    game.finishOrder.push(player);
    return game;
}
