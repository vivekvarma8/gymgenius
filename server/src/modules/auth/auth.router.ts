import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/login", controller.login);
router.post("/refresh", controller.refreshToken);

export { router as authRouter };
