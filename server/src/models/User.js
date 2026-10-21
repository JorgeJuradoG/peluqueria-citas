import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon", index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "stylist", "client"],
      default: "client",
    },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// La misma persona puede ser clienta de dos peluquerías distintas
userSchema.index({ salon: 1, email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);