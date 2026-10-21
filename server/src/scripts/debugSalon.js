import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const demo = await db.collection("salons").findOne({ slug: "peluqueria-demo" });
if (!demo) throw new Error("No existe la peluquería peluqueria-demo");

for (const name of ["users", "services", "stylists", "appointments"]) {
  const total = await db.collection(name).countDocuments();
  const sinSalon = await db.collection(name).countDocuments({ salon: { $exists: false } });
  console.log(`${name}: ${total} documentos, ${sinSalon} sin salon`);

  if (sinSalon > 0) {
    const res = await db
      .collection(name)
      .updateMany({ salon: { $exists: false } }, { $set: { salon: demo._id } });
    console.log(`  -> corregidos: ${res.modifiedCount}`);
  }
}

await mongoose.disconnect();