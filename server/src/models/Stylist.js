import mongoose from "mongoose";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const workingHoursSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true, match: timeRegex },
    end: { type: String, required: true, match: timeRegex },
  },
  { _id: false }
);

workingHoursSchema.pre("validate", function () {
  if (this.start && this.end && this.start >= this.end) {
    this.invalidate("end", "La hora de fin debe ser posterior a la de inicio");
  }
});

const stylistSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String, trim: true, default: "" },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    workingHours: [workingHoursSchema],
    daysOff: [{ type: Date }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Stylist", stylistSchema);