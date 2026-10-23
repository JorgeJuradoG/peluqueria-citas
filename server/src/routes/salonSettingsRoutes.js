import { Router } from "express";
import { updateSalonSettings } from "../controllers/salonController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.put("/", requireAuth, requireRole("admin"), updateSalonSettings);

export default router;