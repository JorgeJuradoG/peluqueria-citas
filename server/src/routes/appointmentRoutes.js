import { Router } from "express";
import {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
} from "../controllers/appointmentController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createAppointment);
router.get("/me", getMyAppointments);
router.patch("/:id/cancel", cancelAppointment);

export default router;