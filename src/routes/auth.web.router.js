import '../config/environment.js';
import express from 'express';
import { default as UserRouter } from './user.router.js';
import { default as AdminRouter } from './admin.router.js';
const router = express.Router();
 
 
router.use("/user", UserRouter);
router.use("/admin", AdminRouter);
 
export default router;
