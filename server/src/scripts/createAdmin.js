import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Salon from "../models/Salon.js";
import User from "../models/User.js";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const slug = process.env.DEFAULT_SALON_SLUG || "peluqueria-demo";

  if (!email || !password) {
    throw new Error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env");
  }

  const salon = await Salon.findOne({ slug });
  if (!salon) throw new Error(`No existe la peluquería "${slug}"`);

  const exists = await User.findOne({ salon: salon._id, email });
  if (exists) {
    console.log("El admin ya existe");
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ salon: salon._id, name: "Admin", email, passwordHash, role: "admin" });
    console.log("Admin creado:", email, "en", slug);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});