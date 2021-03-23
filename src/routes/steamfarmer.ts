import { Router } from "express";
import * as ControllerFarmer from "../controllers/steamfarmer";
const router = Router();

router.post("", ControllerFarmer.start);
router.delete("", ControllerFarmer.stop);

export default router;
