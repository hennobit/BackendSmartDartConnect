import { createServer } from 'http';
import { Server } from 'socket.io';

                                                                              
const httpServer = createServer();
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  io.on('beispiel-event', (zahl: number) => {
    console.log(`So macht man Events. Zahl ${zahl} wurde gesendet`);
  })
});

httpServer.listen(8080)
console.log("Server läuft auf 8080")
