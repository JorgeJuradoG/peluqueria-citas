import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Salon from "../models/Salon.js";
import User from "../models/User.js";

// Uso: npm run create-salon -- <slug> "<Nombre>" <emailAdmin> <passwordAdmin>
const [slug, name, email, password] = process.argv.slice(2);

async function main() {
  if (!slug || !name || !email || !password) {
    throw new Error('Uso: npm run create-salon -- <slug> "<Nombre>" <emailAdmin> <password>');
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const salon = await Salon.create({ name, slug });
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    salon: salon._id,
    name: "Admin",
    email: email.toLowerCase(),
    passwordHash,
    role: "admin",
  });

  console.log(`Peluquería "${name}" (${slug}) creada con admin ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});