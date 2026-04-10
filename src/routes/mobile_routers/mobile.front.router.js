import '../../config/environment.js';
import express from 'express';
import { default as loginRouter } from './mobile.login.router.js';
import { default as pushNotificationRouter } from './mobile.pushNotification.router.js';
import trackIpAddressDeviceId from '../../middlewares/trackIpAddressDeviceId.js';
const router = express.Router();
import { generateCsrfToken } from '../../middlewares/csrf.js';
// router.use(trackIpAddressDeviceId);

 
router.use('/login',loginRouter)
router.use('/push-notification', pushNotificationRouter)





export default router;