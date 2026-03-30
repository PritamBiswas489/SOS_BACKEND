import '../../config/environment.js';
import express from 'express';
import { default as profileRouter } from './mobile.profile.router.js';
const router = express.Router();

router.use("/profile", profileRouter);


export default router;
