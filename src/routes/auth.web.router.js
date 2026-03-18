import '../config/environment.js';
import express from 'express';
import { default as jwtVerifyWeb } from '../middlewares/jwtVerifyWeb.js';
import { default as licenseRouter } from './license.router.js';
import { default as kycRouter } from './kyc.router.js';
const router = express.Router();

router.use(jwtVerifyWeb);

router.use("/license", licenseRouter);
router.use("/kyc", kycRouter);
 
export default router;
