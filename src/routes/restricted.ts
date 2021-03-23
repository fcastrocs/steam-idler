import { Router } from "express";
import * as ControllerRestricted from "../controllers/restricted";
const router = Router();

router.put("/proxies", ControllerRestricted.fetchProxies);
router.put("/steamcms", ControllerRestricted.fetchSteamCMs);

router.delete("/user", ControllerRestricted.deleteUser);
router.put("/steamaccounts/logoff", ControllerRestricted.logoffAllSteamAccs);

export default router;
