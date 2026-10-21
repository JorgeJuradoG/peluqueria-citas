import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon", required: true, index: true },
    name: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);