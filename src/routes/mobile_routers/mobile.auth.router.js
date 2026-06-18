import '../../config/environment.js';
import express from 'express';
import { default as jwtVerify } from '../../middlewares/jwtVerify.js';
import { default as UserRouter } from './mobile.user.router.js';
import { default as TrustedContactRouter } from './mobile.trustedContact.router.js';
import { default as ChatRouter } from './mobile.chat.router.js';
import {default as sosRouter} from './mobile.sos.router.js';
import {default as healthRouter} from './mobile.health.router.js';
import { default as emergencyServicesRouter } from './mobile.emergencyServices.router.js';
import { default as appFeedbackRouter } from './mobile.appFeedback.router.js';
import { default as abuserReportRouter } from './mobile.abuserReport.router.js';
import { default as settingsRouter } from './mobile.settings.router.js';
 
const router = express.Router();

router.use(jwtVerify);
router.use("/user", UserRouter);
router.use("/trusted-contact", TrustedContactRouter);
router.use("/chat", ChatRouter);
router.use("/sos", sosRouter);
router.use("/health", healthRouter);
router.use("/emergency-services", emergencyServicesRouter);
router.use("/app-feedback", appFeedbackRouter);
router.use("/abuser-report", abuserReportRouter);
router.use("/settings", settingsRouter);
export default router;
