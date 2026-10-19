import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Públicas: cualquiera puede ver los servicios
router.get("/", getServices);
router.get("/:id", getServiceById);

// Solo admin
router.post("/", requireAuth, requireRole("admin"), createService);
router.put("/:id", requireAuth, requireRole("admin"), updateService);
router.delete("/:id", requireAuth, requireRole("admin"), deleteService);

export default router;