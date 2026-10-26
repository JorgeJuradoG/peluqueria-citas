import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, 
      ref: "Salon", 
      index: true,
      required: function() {
        return this.role !== "superadmin"; // superadmins don't belong to a specific salon
      },
    },
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
    pendingInvite: { type: Boolean, default: false },

    // Solo se pone en false al crear el dueño de una peluquería nueva.
    // Con default true, las cuentas que ya existen cuentan como verificadas sin migrar nada
    emailVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// La misma persona puede ser clienta de dos peluquerías distintas
userSchema.index({ salon: 1, email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);