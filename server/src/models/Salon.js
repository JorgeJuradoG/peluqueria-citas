import mongoose from "mongoose";
import { CARDS, DECORS, FONTS, HEROES, ICONS, RADII } from "../utils/branding.js";

const brandingSchema = new mongoose.Schema(
  {
    accent: { type: String, default: "#b08d57", match: /^#[0-9a-f]{6}$/i },
    font: { type: String, enum: FONTS, default: "classic" },
    radius: { type: String, enum: RADII, default: "soft" },
    icon: { type: String, enum: ICONS, default: "scissors" },
    hero: { type: String, enum: HEROES, default: "dark" },
    decor: { type: String, enum: DECORS, default: "glow" },
    cards: { type: String, enum: CARDS, default: "shadow" },
  },
  { _id: false }
);

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

    branding: { type: brandingSchema, default: () => ({}) },

    tagline: { type: String, trim: true, maxlength: 120, default: "" },
    heroTitle: { type: String, trim: true, maxlength: 80, default: "" },
    about: { type: String, trim: true, maxlength: 600, default: "" },
    hours: { type: String, trim: true, maxlength: 200, default: "" },
    address: { type: String, trim: true, maxlength: 160, default: "" },
    phone: { type: String, trim: true, default: "" },

    social: {
      instagram: { type: String, trim: true, default: "" },
      whatsapp: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
    },
    sections: {
      howItWorks: { type: Boolean, default: true },
      perks: { type: Boolean, default: true },
    },

    // Peluquería de demostración: solo lectura. La fija el script resetDemo, nunca la API
    demo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Salon", salonSchema);