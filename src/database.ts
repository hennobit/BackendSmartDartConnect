import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { User } from './interfaces/db/user';
import { Friend } from './interfaces/db/friend';
import { sendPlayerOnline } from './interfaces/player';

const app = express();
app.use(bodyParser.json());
app.use(cors());
const db = new sqlite3.Database('./database/smartdart.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SmartDart🎯 Database.');
});

app.post('/login', (req: Request, res: Response) => {
    console.log(req.body);
    const { username, socketId } = req.body; // Socket-ID aus dem Request-Body abrufen

    db.get('SELECT id FROM User WHERE name = ?', [username], (err, row: User) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { id } = row;

        // Abfrage der "friend"-Einträge mit ID-Vergleich
        db.all('SELECT * FROM friend WHERE user1_id = ? OR user2_id = ?', [id, id], (err, rows: Friend[]) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.json({ userId: id, friends: rows });

            rows.forEach(async (friend: Friend) => {
                const friendUserId = friend.user1_id !== id ? friend.user1_id : friend.user2_id;
                const friendSocketId = await getUserSocketId(friendUserId);

                console.log(friend, friendUserId, friendSocketId)
                if (friendSocketId) {
                    sendPlayerOnline(id, friendSocketId);
                    console.log('an ', friendSocketId + ' gesendet');
                }
            });
        });

        insertSocketId(id, socketId);
    });
});

export function insertSocketId(userId: number, socketId: string) {
    db.run('UPDATE user SET socketId = ? WHERE id = ?', [socketId, userId], (err) => {
        if (err) {
            console.error(err);
        }
    });
}

export function removeSocketId(socketId: string) {
    db.run('UPDATE user SET socketId = NULL WHERE socketId = ?', [socketId], (err) => {
        if (err) {
            console.error(err);
        }
    });
}

// Das ist die Route für die ProfileView eines Nutzers, deswegen werden hier drei Datensätze returned, wegen der Erfolge
app.post('/user/profile', (req: Request, res: Response) => {
    const { username } = req.body;
    console.log('POST /user/profile', username);
    db.all(
        `SELECT u.id, u.profilePictureUrl, u.name, u.status, a.name AS achievementName, a.description AS achievementDescription, a.imageUrl FROM user u
    LEFT JOIN achievement a ON u.id = a.userId
    where u.name = ?
    LIMIT 3`,
        [username],
        (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!row) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json(row);
        }
    );
});

app.post('/user', (req, res) => {
    const { userId } = req.body;
    console.log('POST /user', userId);

    db.get(`SELECT * FROM user u WHERE u.id = ?`, [userId], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(row);
    });
});

async function getUserSocketId(userId: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
        db.get('SELECT socketId FROM user WHERE id = ?', [userId], (err, row: User) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            if (!row) {
                resolve(null);
                return;
            }
            resolve(row.socketId);
        });
    });
}

export default app;
