import '../../config/environment.js';
import express from 'express';
import { default as UserRouter } from './user.router.js';
import { default as AdminRouter } from './admin.router.js';
import {default as NgoRouter} from './ngo.router.js';
const router = express.Router();
 
 
router.use("/user", UserRouter);
router.use("/admin", AdminRouter);
router.use("/ngo", NgoRouter);

 
export default router;
