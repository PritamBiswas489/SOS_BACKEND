import express from 'express';
const router = express.Router();
import { default as frontRouter } from './front.router.js';
import { default as authWebRouter } from './auth.web.router.js';
// import { default as currencyRouter } from './currency.router.js';
import { default as redisRouter } from './redis.router.js';

// import { default as adminRouter } from './admin.router.js';


router.use('/front-web', frontRouter);
router.use('/redis', redisRouter);
router.use('/auth-web', authWebRouter);
// router.use('/currency', currencyRouter);
// router.use('/admin', adminRouter);


export default router;
