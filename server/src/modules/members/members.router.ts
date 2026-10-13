import { Router } from "express";
import multer from "multer";
import { MembersController } from "./members.controller";
import { authenticate } from "../../lib/middleware/authenticate";

const router = Router();
const controller = new MembersController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000 } });

router.use(authenticate);
router.get("/", controller.list);
router.get("/stats", controller.stats);
router.post("/", controller.create);
router.post("/import", upload.single("file"), controller.importMembers);
router.post("/bulk-delete", controller.removeBulk);
router.delete("/bulk", controller.removeBulk);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export { router as membersRouter };