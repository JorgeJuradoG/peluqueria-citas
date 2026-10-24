import { Router } from "express";
import {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  getAgenda,
  getToday,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createAppointment);
router.get("/me", getMyAppointments);
router.get("/agenda", requireRole("admin", "stylist"), getAgenda);
router.get("/today", requireRole("admin", "stylist"), getToday);
router.patch("/:id/cancel", cancelAppointment);
router.patch("/:id/status", requireRole("admin", "stylist"), updateAppointmentStatus);
router.patch("/:id/reschedule", rescheduleAppointment);

export default router;