import { Router } from "express";
import {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  getAgenda,
} from "../controllers/appointmentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);


router.post("/", createAppointment);
router.get("/me", getMyAppointments);
router.get("/agenda", requireRole("admin", "stylist"), getAgenda);
router.patch("/:id/cancel", cancelAppointment);

export default router;