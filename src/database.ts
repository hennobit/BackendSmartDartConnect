import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { User } from './interfaces/db/user';

const app = express();
app.use(bodyParser.json())
app.use(cors());
const db = new sqlite3.Database('./database/smartdart.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SmartDart🎯 Database.');
});

app.post('/login', (req: Request, res: Response) => {
    console.log(req.body);
    const { username } = req.body;
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
        res.json({ userId: id });
    });
});

export default app;
