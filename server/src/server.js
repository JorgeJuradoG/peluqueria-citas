import http from "http";
import { initSockets } from "./sockets/index.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import stylistRoutes from "./routes/stylistRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import { resolveSalon } from "./middlewares/salon.js";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando" });
});
app.use("/api", resolveSalon);
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/stylists", stylistRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);
initSockets(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
});