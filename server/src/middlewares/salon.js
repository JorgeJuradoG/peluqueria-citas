import Salon from "../models/Salon.js";

export async function resolveSalon(req, res, next) {
  const slug = String(req.headers["x-salon"] || "").toLowerCase();

  if (!slug) {
    return res.status(400).json({ message: "Falta la peluquería (cabecera X-Salon)" });
  }

  const salon = await Salon.findOne({ slug, active: true });
  if (!salon) {
    return res.status(404).json({ message: "Peluquería no encontrada" });
  }

  req.salon = salon;
  next();
}