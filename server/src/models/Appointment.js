import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon", index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stylist: { type: mongoose.Schema.Types.ObjectId, ref: "Stylist", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Acelera la búsqueda de solapamientos por estilista y franja
appointmentSchema.index({ stylist: 1, start: 1, end: 1 });

appointmentSchema.index(
  { stylist: 1, start: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

export default mongoose.model("Appointment", appointmentSchema);