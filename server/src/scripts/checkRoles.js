import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const fix = process.argv.includes("--fix");

const salons = new Map(
  (await db.collection("salons").find().toArray()).map((s) => [String(s._id), s.slug])
);
const users = await db.collection("users").find().toArray();
const profiles = await db.collection("stylists").find().toArray();
const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

for (const u of users) {
  const profile = profileByUser.get(String(u.user ?? u._id));
  const wrong = profile && !["stylist", "admin"].includes(u.role);
  console.log(
    `${salons.get(String(u.salon)) ?? "?"}  ${u.email}  rol=${u.role}  perfil=${profile ? "sí" : "no"}` +
      (wrong ? "   <-- TIENE PERFIL DE ESTILISTA PERO ROL " + u.role : "")
  );
  if (wrong && fix) {
    await db.collection("users").updateOne({ _id: u._id }, { $set: { role: "stylist" } });
    console.log("   corregido a stylist");
  }
}

await mongoose.disconnect();