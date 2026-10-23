import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSockets } from "./sockets/index.js";
import { startReminders } from "./jobs/reminders.js";

const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);
initSockets(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    startReminders();
  });
});