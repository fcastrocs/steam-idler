import { Router } from "express";
const router = Router();
import * as authController from "../controllers/auth";

router.get("/login", authController.login);
router.get("/authorize", authController.authorize);
router.get("/logout", authController.logout);

export default router;
