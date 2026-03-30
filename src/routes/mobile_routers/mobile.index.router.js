import express from 'express';
const router = express.Router();
import { default as frontRouter } from './mobile.front.router.js';
import { default as redisRouter } from './mobile.redis.router.js';
import { default as authRouter } from './mobile.auth.router.js';

// import { default as adminRouter } from './admin.router.js';

router.use('/front', frontRouter);
router.use('/redis', redisRouter);
router.use('/auth', authRouter);
 
 
export default router;
