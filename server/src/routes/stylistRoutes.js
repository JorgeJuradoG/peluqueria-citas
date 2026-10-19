import { Router } from "express";
import {
  getStylists,
  getStylistById,
  createStylist,
  updateStylist,
} from "../controllers/stylistController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", getStylists);
router.get("/:id", getStylistById);

router.post("/", requireAuth, requireRole("admin"), createStylist);
router.put("/:id", requireAuth, requireRole("admin"), updateStylist);

export default router;