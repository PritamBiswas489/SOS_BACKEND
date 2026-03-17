import express from 'express';
const router = express.Router();
import { default as frontRouter } from './front.router.js';
import { default as authRouter } from './auth.router.js';
import { default as currencyRouter } from './currency.router.js';
import { default as redisRouter } from './redis.router.js';

import { default as adminRouter } from './admin.router.js';






router.use('/front', frontRouter);
router.use('/redis', redisRouter);
// router.use('/auth', authRouter);
// router.use('/currency', currencyRouter);
// router.use('/admin', adminRouter);


export default router;
