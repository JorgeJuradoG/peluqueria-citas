import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("El admin ya existe");
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name: "Admin", email, passwordHash, role: "admin" });
    console.log("Admin creado:", email);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});