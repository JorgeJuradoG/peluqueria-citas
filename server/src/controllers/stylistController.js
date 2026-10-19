import Stylist from "../models/Stylist.js";
import User from "../models/User.js";

export async function getStylists(req, res) {
  const stylists = await Stylist.find({ active: true })
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  res.json(stylists);
}

export async function getStylistById(req, res) {
  const stylist = await Stylist.findById(req.params.id)
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  if (!stylist) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }
  res.json(stylist);
}

export async function createStylist(req, res) {
  const { userId, bio, services, workingHours, daysOff } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  // Al crear el perfil, el usuario pasa a tener rol stylist
  if (user.role === "client") {
    user.role = "stylist";
    await user.save();
  }

  const stylist = await Stylist.create({
    user: userId,
    bio,
    services,
    workingHours,
    daysOff,
  });
  res.status(201).json(stylist);
}

export async function updateStylist(req, res) {
  const { bio, services, workingHours, daysOff, active } = req.body;
  const stylist = await Stylist.findById(req.params.id);
  if (!stylist) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }

  if (bio !== undefined) stylist.bio = bio;
  if (services !== undefined) stylist.services = services;
  if (workingHours !== undefined) stylist.workingHours = workingHours;
  if (daysOff !== undefined) stylist.daysOff = daysOff;
  if (active !== undefined) stylist.active = active;

  await stylist.save();
  res.json(stylist);
}