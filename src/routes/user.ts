import { Router } from "express";
import * as ControllerUser from "../controllers/user";
const router = Router();

router.get("/steamaccounts", ControllerUser.steamAccounts);
router.get("/steamaccount", ControllerUser.steamAccount);
router.put("/refreshidentity", ControllerUser.refreshIdentity);

export default router;
