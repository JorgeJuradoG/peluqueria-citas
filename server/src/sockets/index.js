import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Salon from "../models/Salon.js";
import Stylist from "../models/Stylist.js";
import { allowedOrigins } from "../utils/origins.js";

let io;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins() },
  });

  // Autenticación: mismo criterio que requireAuth
  io.use(async (socket, next) => {
    try {
      const { token, salon: slug } = socket.handshake.auth || {};
      if (!token || !slug) return next(new Error("No autorizado"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const [user, salon] = await Promise.all([
        User.findById(payload.id).select("salon tokenVersion"),
        Salon.findOne({ slug: String(slug).toLowerCase(), active: true }).select("_id"),
      ]);

      if (
        !user ||
        !salon ||
        (payload.tv ?? 0) !== (user.tokenVersion ?? 0) ||
        String(user.salon) !== String(salon._id)
      ) {
        return next(new Error("No autorizado"));
      }

      socket.data.salonId = String(salon._id);
      next();
    } catch {
      next(new Error("No autorizado"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("stylist:join", async (stylistId) => {
      if (!mongoose.isValidObjectId(stylistId)) return;
      // Solo salas de estilistas de la propia peluquería
      const ok = await Stylist.exists({ _id: stylistId, salon: socket.data.salonId });
      if (ok) socket.join(`stylist:${stylistId}`);
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