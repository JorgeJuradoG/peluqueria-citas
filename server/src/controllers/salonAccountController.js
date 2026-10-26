import bcrypt from "bcryptjs";
import Appointment from "../models/Appointment.js";
import AuthToken from "../models/AuthToken.js";
import Salon from "../models/Salon.js";
import Service from "../models/Service.js";
import Stylist from "../models/Stylist.js";
import User from "../models/User.js";
import { sendSalonClosed } from "../services/authMails.js";

// Admin: descarga todos los datos de SU peluquería. Nunca incluye contraseñas ni enlaces
export async function exportSalonData(req, res) {
  const salon = req.salon;
  const filter = { salon: salon._id };

  const [users, services, stylists, appointments] = await Promise.all([
    User.find(filter).select("name email phone role createdAt").lean(),
    Service.find(filter).lean(),
    Stylist.find(filter).populate("user", "name email").lean(),
    Appointment.find(filter)
      .populate("client", "name email phone")
      .populate("service", "name price durationMinutes")
      .populate({ path: "stylist", select: "user", populate: { path: "user", select: "name" } })
      .lean(),
  ]);

  const s = salon.toObject();
  res.json({
    exportedAt: new Date().toISOString(),
    salon: {
      name: s.name,
      slug: s.slug,
      timezone: s.timezone,
      branding: s.branding,
      staffTerm: s.staffTerm,
      cancellationHours: s.cancellationHours ?? 0,
      tagline: s.tagline,
      heroTitle: s.heroTitle,
      about: s.about,
      hours: s.hours,
      address: s.address,
      phone: s.phone,
      social: s.social,
      sections: s.sections,
      createdAt: s.createdAt,
    },
    users,
    services,
    stylists,
    appointments,
  });
}

// Admin: cierra su peluquería y borra TODO lo que cuelga de ella. No se puede deshacer
export async function deleteSalon(req, res) {
  const salon = req.salon;

  if (salon.demo) {
    return res.status(403).json({ message: "La peluquería de demostración no se puede cerrar" });
  }

  const slug = String(req.body.slug || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (slug !== salon.slug) {
    return res
      .status(400)
      .json({ message: "La dirección escrita no coincide con la de tu peluquería" });
  }

  const admin = await User.findOne({ _id: req.user.id, salon: salon._id });
  if (!admin) return res.status(404).json({ message: "Usuario no encontrado" });

  // 400 (no 401) para que la web no lo confunda con una sesión caducada
  if (!(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(400).json({ message: "La contraseña no es correcta" });
  }

  // Datos para el correo de despedida, antes de que desaparezcan
  const recipient = { name: admin.name, email: admin.email };
  const brand = salon.toObject();

  // Primero lo que cuelga de la peluquería y al final ella misma:
  // si algo falla a medias, se puede repetir el cierre sin dejar datos huérfanos
  const filter = { salon: salon._id };
  await Appointment.deleteMany(filter);
  await AuthToken.deleteMany(filter);
  await Stylist.deleteMany(filter);
  await Service.deleteMany(filter);
  await User.deleteMany(filter);
  await Salon.deleteOne({ _id: salon._id });

  sendSalonClosed(recipient, brand); // sin await: no retrasa la respuesta

  res.json({ message: "Tu peluquería se ha cerrado y sus datos se han borrado" });
}