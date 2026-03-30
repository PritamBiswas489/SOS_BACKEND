import '../../config/environment.js';
import express from 'express';
import { default as jwtVerify } from '../../middlewares/jwtVerify.js';
import { default as UserRouter } from './mobile.user.router.js';
import { default as TrustedContactRouter } from './mobile.trustedContact.router.js';
const router = express.Router();

router.use(jwtVerify);
router.use("/user", UserRouter);
router.use("/trusted-contact", TrustedContactRouter);

export default router;
