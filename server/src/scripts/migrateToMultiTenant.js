import "dotenv/config";
import mongoose from "mongoose";
import Salon from "../models/Salon.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Stylist from "../models/Stylist.js";
import Appointment from "../models/Appointment.js";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Crea (o reutiliza) la peluquería inicial
  const slug = process.env.DEFAULT_SALON_SLUG || "peluqueria-demo";
  let salon = await Salon.findOne({ slug });
  if (!salon) {
    salon = await Salon.create({
      name: process.env.DEFAULT_SALON_NAME || "Peluquería Demo",
      slug,
      timezone: process.env.SALON_TIMEZONE || "Europe/Madrid",
    });
    console.log(`Peluquería creada: ${salon.name} (${salon.slug})`);
  } else {
    console.log(`Peluquería existente: ${salon.name} (${salon.slug})`);
  }

  // 2. Asigna esa peluquería a todo lo que aún no tenga una
  for (const [name, Model] of [
    ["usuarios", User],
    ["servicios", Service],
    ["estilistas", Stylist],
    ["citas", Appointment],
  ]) {
    const res = await Model.updateMany(
      { salon: { $exists: false } },
      { $set: { salon: salon._id } }
    );
    console.log(`${name}: ${res.modifiedCount} actualizados`);
  }

  // 3. Sincroniza índices (elimina el antiguo "email único" y crea el nuevo por peluquería)
  for (const Model of [Salon, User, Service, Stylist, Appointment]) {
    await Model.syncIndexes();
  }
  console.log("Índices sincronizados.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});