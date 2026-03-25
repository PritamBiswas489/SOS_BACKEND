import '../../config/environment.js';
import express from 'express';
import { default as jwtVerifyWebUser } from '../../middlewares/jwtVerifyWebUser.js';
import { default as licenseRouter } from './license.router.js';
import { default as kycRouter } from './kyc.router.js';
import { default as AdminRouter } from './admin.router.js';
const router = express.Router();

router.use(jwtVerifyWebUser);

router.use("/license", licenseRouter);
router.use("/kyc", kycRouter);
 
export default router;
