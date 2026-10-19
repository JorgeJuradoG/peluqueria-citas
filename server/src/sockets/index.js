import { Server } from "socket.io";

let io;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    // El cliente se une a la "sala" de un estilista para recibir sus cambios
    socket.on("stylist:join", (stylistId) => {
      socket.join(`stylist:${stylistId}`);
    });

    socket.on("stylist:leave", (stylistId) => {
      socket.leave(`stylist:${stylistId}`);
    });
  });

  return io;
}

export function emitToStylist(stylistId, event, payload) {
  if (io) io.to(`stylist:${stylistId}`).emit(event, payload);
}