import '../../config/environment.js';
import express from 'express';
import { default as jwtVerify } from '../../middlewares/jwtVerify.js';
import { default as UserRouter } from './mobile.user.router.js';
import { default as TrustedContactRouter } from './mobile.trustedContact.router.js';
import { default as ChatRouter } from './mobile.chat.router.js';
import {default as sosRouter} from './mobile.sos.router.js';
import {default as healthRouter} from './mobile.health.router.js';
 
const router = express.Router();

router.use(jwtVerify);
router.use("/user", UserRouter);
router.use("/trusted-contact", TrustedContactRouter);
router.use("/chat", ChatRouter);
router.use("/sos", sosRouter);
router.use("/health", healthRouter);

export default router;
