import { Router } from "express";
import { MessageController } from "./message.controller";
import { authenticate } from "../../lib/middleware/authenticate";

const router = Router();
const controller = new MessageController();

router.use(authenticate);
router.post("/send", controller.send);
router.get("/logs", controller.getLogs);
router.post("/trigger-daily-cron", controller.triggerDailyCronScan);

export { router as messageRouter };
