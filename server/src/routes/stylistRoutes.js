import { Router } from "express";
import {
  getStylists,
  getAllStylists,
  getStylistById,
  createStylist,
  updateStylist,
  getAvailability,
} from "../controllers/stylistController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", getStylists);
router.get("/manage/all", requireAuth, requireRole("admin"), getAllStylists);
router.get("/:id/availability", getAvailability);
router.get("/:id", getStylistById);

router.post("/", requireAuth, requireRole("admin"), createStylist);
router.put("/:id", requireAuth, requireRole("admin"), updateStylist);

export default router;