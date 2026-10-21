import mongoose from "mongoose";

const salonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Identificador para la URL: "peluqueria-lola"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(-[a-z0-9]+)*$/,
    },
    timezone: { type: String, default: "Europe/Madrid" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Salon", salonSchema);