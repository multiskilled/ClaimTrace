import { Router, type IRouter } from "express";
import healthRouter from "./health";
import claimsRouter from "./claims";
import evidenceRouter from "./evidence";
import analysisRouter from "./analysis";
import portalRouter from "./portal";
import settingsRouter from "./settings";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(claimsRouter);
router.use(evidenceRouter);
router.use(analysisRouter);
router.use(portalRouter);
router.use(settingsRouter);
router.use(seedRouter);

export default router;
