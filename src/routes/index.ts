import { Router } from "express";
const router = Router();
import steamAccountRoutes from "./steamaccount";
import steamFarmerRoutes from "./steamfarmer";
import userRoutes from "./user";
import authRoutes from "./auth";
import restrictedRoutes from "./restricted";
import * as mw from "./middleware";

router.use("/auth", authRoutes);
router.use("/user", [mw.authenticated, userRoutes]);
router.use("/steamaccount", [mw.authenticated, mw.accountName, steamAccountRoutes]);
router.use("/steamaccount/farm", [mw.authenticated, mw.accountName, steamFarmerRoutes]);
router.use("/restricted", [mw.authenticated, mw.admin, restrictedRoutes]);

export default router;
