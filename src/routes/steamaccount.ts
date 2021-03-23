import { Router } from "express";
import * as ControllerSteamAcc from "../controllers/steamaccount";
const router = Router();

router.post("", ControllerSteamAcc.add);
router.delete("", ControllerSteamAcc.remove);
router.put("/verify", ControllerSteamAcc.verifyLogin);
router.put("/logout", ControllerSteamAcc.logout);
router.put("/login", ControllerSteamAcc.reLogin);
router.put("/idle", ControllerSteamAcc.idleGames);
router.put("/epersonastate", ControllerSteamAcc.changeEpersonaState);
router.put("/nickname", ControllerSteamAcc.changeNickName);
router.put("/requestfreelicense", ControllerSteamAcc.requestFreeLicense);

export default router;
