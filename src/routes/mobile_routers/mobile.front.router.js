import '../../config/environment.js';
import express from 'express';
import { default as loginRouter } from './mobile.login.router.js';
import trackIpAddressDeviceId from '../../middlewares/trackIpAddressDeviceId.js';
const router = express.Router();
import { generateCsrfToken } from '../../middlewares/csrf.js';
// router.use(trackIpAddressDeviceId);

 
router.use('/login',loginRouter)





export default router;