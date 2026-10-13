import { Router } from "express";
import { AIController } from "./ai.controller";
import { authenticate } from "../../lib/middleware/authenticate";
import { aiRateLimiter } from "../../lib/middleware/request-rate-limit";

const router = Router();
const controller = new AIController();

router.use(authenticate);
router.use(aiRateLimiter);
router.post("/chat", controller.chat);
router.post("/chat/reset", controller.reset);

export { router as aiRouter };