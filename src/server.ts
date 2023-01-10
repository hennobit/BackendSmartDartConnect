import { createServer } from 'http';
import { Server } from 'socket.io';
import express, {Request, Response} from 'express';

const app = express()                                        
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get('/throw', (req: Request, res: Response) => {
  res.send("" + Math.floor(Math.random() * 61))
})

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  socket.on('beispiel-event', (zahl: number) => {
    console.log(`So macht man Events. Zahl ${zahl} wurde gesendet`);
  })
});

app.listen(8081)
console.log("Server läuft auf 8081")
