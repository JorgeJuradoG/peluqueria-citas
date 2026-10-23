import { Router } from "express";
import { getStats } from "../controllers/statsController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getStats);

export default router;