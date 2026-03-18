import "../config/environment.js";
import express from "express";
 
import ProfileController from "../controllers/profile.controller.js";
import { upload } from "../controllers/uploadProfileImage.controller.js";
 
const router = express.Router();


/**
 * @swagger
 * /api/auth/profile/auth-check:
 *   get:
 *     summary: Check authentication status
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Auth check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Auth check successful
 */
router.get("/auth-check", async (req, res, next) => {
   res.return({'message': 'Auth check successful'});
});

/**
 * @swagger
 * /api/auth/profile/detail:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Auth-Profile routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - User profile retrieved
 */

router.get("/detail", async (req, res, next) => {
     const profileDetails = await ProfileController.getProfileDetails({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
     res.return(profileDetails);
});
/**
 * @swagger
 * /api/auth/profile/edit:
 *   put:
 *     summary: Edit user profile
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 default: "John Doe"
 *               email:
 *                 type: string
 *                 default: "john.doe@example.com"
 *               address:
 *                 type: string
 *                 default: "123 Main St, City, Country"
 *               dob:
 *                 type: string
 *                 default: "1990-01-01"
 *               language:
 *                 type: string
 *                 default: "he"
 *     responses:
 *       200:
 *         description: Success - User profile updated
 */

router.put("/edit", async (req, res, next) => {
  const profileDetails = await ProfileController.updateProfile({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
  res.return(profileDetails);
});
/**
 * @swagger
 * /api/auth/profile/upload-profile-image:
 *   post:
 *     summary: Upload user profile image
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success - User profile image uploaded
 *       400:
 *         description: Bad Request - Invalid file type or size
 */
router.post("/upload-profile-image", upload.single("image"), async (req, res) => {
   const profileDetails = await ProfileController.updateProfileAvatar({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user, file: req.file });
   res.return(profileDetails);
})
/**
 * @swagger
 * /api/auth/profile/update-pin:
 *   put:
 *     summary: Update user pin
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               existingPinCode:
 *                 type: string
 *                 description: The existing pin code to verify before updating
 *                 example: "1234"
 *               pinCode:
 *                 type: string
 *                 description: The new pin code to set
 *                 example: "5678"
 *     responses:
 *       200:
 *         description: Success - User pin updated
 */

router.put("/update-pin", async (req, res) => {
  const response = await ProfileController.updatePin({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});


/**
 * @swagger
 * /api/auth/profile/verify-pin:
 *   post:
 *     summary: Verify user pin
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pinCode:
 *                 type: string
 *                 description: The pin code to verify
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Success - Pin verified
 */
router.post("/verify-pin", async (req, res) => {
   const response = await ProfileController.verifyPin({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});

/**
 * @swagger
 * /api/auth/profile/save-fcm-token:
 *   post:
 *     summary: Save user's mobile FCM token
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: The FCM token to register/update
 *                 example: "fcm_token_example_123"
 *     responses:
 *       200:
 *         description: Success - FCM token updated
 */
router.post("/save-fcm-token", async (req, res) => {
  const response = await ProfileController.saveFcmToken({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
  res.return(response);
});


 
/**
 * @swagger
 * /api/auth/profile/clear-device-id:
 *   post:
 *     summary: Clear device ID for user
 *     tags: 
 *       - Auth-Profile routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Device ID cleared successfully
 */
router.post("/clear-device-id",async (req, res) => {  
   const response = await ProfileController.clearDeviceId({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});


/**
 * @swagger
 * /api/auth/profile/delete-device-id:
 *   post:
 *     summary: Delete a specific device ID for the user
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: The device ID to delete
 *                 example: "device_id_123"
 *     responses:
 *       200:
 *         description: Device ID deleted successfully
 */
router.post("/delete-device-id", async (req, res) => {  
   const response = await ProfileController.deleteDeviceId({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});



/**
 * @swagger
 * /api/auth/profile/send-push-notification:
 *   post:
 *     summary: Send push notification to connected mobile via firebase
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Hi from Travel Wallet"
 *               body:
 *                 type: string
 *                 example: "Dummy push notification for testing purposes.Ignore it."
 *     responses:
 *       200:
 *         description: Success - JSON received
 */
router.post("/send-push-notification", async (req, res) => {
   const response = await ProfileController.sendPushNotification({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
})

/**
 * @swagger
 * /api/auth/profile/get-notifications:
 *   post:
 *     summary: Get paginated list of user notifications
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Maximum number of notifications to return
 *               page:
 *                 type: integer
 *                 default: 1
 *                 minimum: 1
 *                 description: Page number to return
 *     responses:
 *       200:
 *         description: Success - Paginated user notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 profiles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 */

router.post("/get-notifications", async (req, res) => {
   const response = await ProfileController.getUserNotifications({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});



/**
 * @swagger
 * /api/auth/profile/mark-all-notifications-as-read:
 *   post:
 *     summary: Mark all notifications as read for the user
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - All notifications marked as read
 */
router.post("/mark-all-notifications-as-read", async (req, res) => {
   const response = await ProfileController.markAllNotificationsAsRead({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);

})
/**
 * @swagger
 * /api/auth/profile/get-unread-notifications-count:
 *   get:
 *     summary: Get the count of unread notifications for the user
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Unread notifications count retrieved
 */
router.get("/get-unread-notifications-count", async (req, res) => {
   const response = await ProfileController.getUnreadNotificationsCount({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
})
/**
 * @swagger
 * /api/auth/profile/notification-bell-icon-color:
 *   get:
 *     summary: Get the color of the notification bell icon for the user
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Notification bell icon color retrieved
 */
router.get("/notification-bell-icon-color", async (req, res) => {
   const response = await ProfileController.getNotificationBellIconColor({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});

/**
 * @swagger
 * /api/auth/profile/get-last-unread-notification:
 *   get:
 *     summary: Get the last unread notification for the user
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Last notification retrieved
 */
router.get("/get-last-unread-notification", async (req, res) => {
   const response = await ProfileController.getLastUnreadNotification({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);

})
/**
 * @swagger
 * /api/auth/profile/get-last-pending-transfer-notification:
 *   get:
 *     summary: Get the last pending transfer notification for the user
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Last pending transfer notification retrieved
 */

router.get("/get-last-pending-transfer-notification", async (req, res) => {
   const response = await ProfileController.getLastPendingTransferNotification({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
})



/**
 * @swagger
 * /api/auth/profile/add-mobile-number-in-contact-list:
 *   post:
 *     summary: Add multiple mobile numbers to the user's contact list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumbers:
 *                 type: array
 *                 description: Array of mobile numbers to add to contact list
 *                 items:
 *                   type: string
 *                 example: ["+919830990010", "+919830990011"]
 *               type:
 *                 type: string
 *                 description: Type of contact (e.g., "send", "request")
 *                 example: "send"
 *     responses:
 *       200:
 *         description: Success - Mobile numbers added to contact list
 */
router.post("/add-mobile-number-in-contact-list", async (req, res) => {
   const response = await ProfileController.addMobileNumberToContactList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});



/**
 * @swagger
 * /api/auth/profile/clear-contact-list:
 *   delete:
 *     summary: Clear the user's contact list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: Type of contact list to clear (e.g., "send", "request")
 *     responses:
 *       200:
 *         description: Success - Contact list cleared
 */
router.delete("/clear-contact-list", async (req, res) => {
   const response = await ProfileController.clearContactList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});

/**
 * @swagger
 * /api/auth/profile/check-mobile-number-in-contact-list:
 *   post:
 *     summary: Check if a mobile number exists in the user's contact list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkUserId:
 *                 type: string
 *                 description: The user ID to check against the contact list
 *                 example: "1"
 *               mobileNumber:
 *                 type: string
 *                 description: The mobile number to check in the contact list
 *                 example: "+919830990010"
 *               type:
 *                 type: string
 *                 default: "send"
 *                 description: Type of contact (e.g., "send", "request")
 *     responses:
 *       200:
 *         description: Success - Mobile number check result
 */
router.post("/check-mobile-number-in-contact-list", async (req, res) => {
   const response = await ProfileController.checkMobileNumberInContactList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});


/**
 * @swagger
 * /api/auth/profile/remove-mobile-number-from-contact-list:
 *   delete:
 *     summary: Remove a mobile number from the user's contact list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Mobile number to remove from contact list
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: Type of contact (e.g., "send", "request")
 *     responses:
 *       200:
 *         description: Success - Mobile number removed from contact list
 */
router.delete("/remove-mobile-number-from-contact-list", async (req, res) => {
   const response = await ProfileController.removeMobileNumberFromContactList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});

/**
 * @swagger
 * /api/auth/profile/add-mobile-number-to-white-list:
 *   post:
 *     summary: Add multiple mobile numbers to the user's white list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of contact (e.g., "send", "request")
 *                 example: "send"
 *               mobileNumbers:
 *                 type: array
 *                 description: Array of mobile number objects to add to white list
 *                 items:
 *                   type: object
 *                   properties:
 *                     displayName:
 *                       type: string
 *                       description: Display name for the mobile number
 *                       example: "John Doe"
 *                     mobileNumber:
 *                       type: string
 *                       description: Mobile number to add to white list
 *                       example: "+919830990065"
 *                     formattedNumber:
 *                       type: string
 *                       description: Formatted mobile number
 *                       example: "+919830990065"
 *                     hasThumbnail:
 *                       type: boolean
 *                       description: Indicates if a thumbnail exists
 *                       example: true
 *                     thumbnailPath:
 *                       type: string
 *                       description: Path to the thumbnail image
 *                       example: "/images/thumbnails/johndoe.png"
 *     responses:
 *       200:
 *         description: Success - Mobile numbers added to white list
 */
router.post("/add-mobile-number-to-white-list", async (req, res) => {
   const response = await ProfileController.addMobileNumberToWhiteList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});




/**
 * @swagger
 * /api/auth/profile/get-mobile-number-white-list:
 *   get:
 *     summary: Get the user's mobile number white list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter white list by type (e.g., "send", "request")
 *     responses:
 *       200:
 *         description: Success - Mobile number white list retrieved
 */

router.get("/get-mobile-number-white-list",async (req, res) => {
   const response = await ProfileController.getMobileNumberWhiteList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});
/**
 * @swagger
 * /api/auth/profile/delete-mobile-number-from-white-list:
 *   delete:
 *     summary: Delete a mobile number from the user's white list
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mobile number to delete from white list
 *     responses:
 *       200:
 *         description: Success - Mobile number deleted from white list
 */

router.delete("/delete-mobile-number-from-white-list", async (req, res) => {
   const response = await ProfileController.deleteMobileNumberFromWhiteList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});


/**
 * @swagger
 * /api/auth/profile/set-request-money-restriction:
 *   post:
 *     summary: Set request money restriction for the user [everyone, noone, contactonly,whitelist]
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restriction:
 *                 type: string
 *                 description: Restriction type for requesting money
 *                 example: "everyone"
 *     responses:
 *       200:
 *         description: Success - Request money restriction set
 */
router.post("/set-request-money-restriction",async (req, res) => {
   const response = await ProfileController.setRequestMoneyRestriction({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});

/**
 * @swagger
 * /api/auth/profile/set-send-money-restriction:
 *   post:
 *     summary: Set send money restriction for the user [everyone, noone, contactonly, whitelist]
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restriction:
 *                 type: string
 *                 description: Restriction type for requesting money
 *                 example: "everyone"
 *     responses:
 *       200:
 *         description: Success - Request money restriction set
 */
router.post("/set-send-money-restriction",async (req, res) => {
   const response = await ProfileController.setSendMoneyRestriction({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});





/**
 * @swagger
 * /api/auth/profile/delete:
 *   delete:
 *     summary: Remove user account
 *     tags: [Auth-Profile routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: Success - User account deleted
 */
router.delete("/delete", async (req, res) => {
  const response = await ProfileController.removeAccount({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers, user: req.user });
   res.return(response);
});


export default router;
