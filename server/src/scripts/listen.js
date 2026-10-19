import { io } from "socket.io-client";

const socket = io("http://localhost:4000");
const stylistId = process.argv[2];

socket.on("connect", () => {
  console.log("Conectado");
  socket.emit("stylist:join", stylistId);
});
socket.on("appointment:created", (d) => console.log("Nueva cita:", d));
socket.on("appointment:cancelled", (d) => console.log("Cita cancelada:", d));