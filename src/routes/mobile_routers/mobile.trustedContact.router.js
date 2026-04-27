
import '../../config/environment.js';
import express from 'express';
import TrustedContactController from '../../controllers/trustedContact.controller.js';
const router = express.Router();
/**
 * @swagger
 * /api-mobile/auth/trusted-contact/send-contact-invitation:
 *   post:
 *     summary: Send invitation to a trusted contact
 *     tags:
 *       - Add trusted contact routes
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
 *               name:
 *                 type: string
 *                 description: Name of the trusted contact
 *                 example: "John Doe"
 *               mobile_number:
 *                 type: string
 *                 description: Mobile number of the trusted contact
 *                 example: "+919876543210"
 *               relationship:
 *                 type: string
 *                 description: Relationship with the trusted contact
 *                 example: "friend"
 *               sos_alert:
 *                 type: boolean
 *                 description: Allow this contact to receive SOS alerts
 *                 example: true
 *               share_location:
 *                 type: boolean
 *                 description: Allow this contact to see your location
 *                 example: true
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
router.post("/send-contact-invitation", async (req, res) => {
    const response = await TrustedContactController.sendTrustedContactInvitation({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});


/**
 * @swagger
 * /api-mobile/auth/trusted-contact/pendings-incoming:
 *   get:
 *     summary: Get pending incoming trusted contact invitations
 *     tags:
 *       - Add trusted contact routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of pending incoming trusted contact invitations
 */
router.get("/pendings-incoming", async (req, res) => {
  const response =
    await TrustedContactController.getPendingIncommingTrustedContactInvitations({
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
      user: req.user,
    });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/trusted-contact/pendings-outgoing:
 *   get:
 *     summary: Get pending outgoing trusted contact invitations
 *     tags:
 *       - Add trusted contact routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of pending outgoing trusted contact invitations
 */
router.get("/pendings-outgoing", async (req, res) => {
  const response =
    await TrustedContactController.getPendingOutgoingTrustedContactInvitations({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/trusted-contact/contacts:
 *   get:
 *     summary: Get list of trusted contacts
 *     tags:
 *       - Add trusted contact routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of trusted contacts
 */
router.get("/contacts", async (req, res) => {
    const response =
      await TrustedContactController.getTrustedContacts({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
  res.return(response);
});
/**
 * @swagger
 * /api-mobile/auth/trusted-contact/accept-contact-invitation:
 *   post:
 *     summary: Accept a trusted contact invitation
 *     tags:
 *       - Add trusted contact routes
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
 *               id:
 *                 type: integer
 *                 description: ID of the trusted contact invitation
 *                 example: 123
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 */
router.post("/accept-contact-invitation", async (req, res) => {
    const response = await TrustedContactController.acceptTrustedContactInvitation({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/trusted-contact/cancel-contact-invitation:
 *   post:
 *     summary: Cancel a trusted contact invitation
 *     tags:
 *       - Add trusted contact routes
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
 *               id:
 *                 type: integer
 *                 description: ID of the trusted contact invitation
 *                 example: 123
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 */
router.post("/cancel-contact-invitation", async (req, res) => {
    const response = await TrustedContactController.cancelTrustedContactInvitation({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/trusted-contact/delete-contact-invitation:
 *   post:
 *     summary: Delete a trusted contact invitation
 *     tags:
 *       - Add trusted contact routes
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
 *               id:
 *                 type: integer
 *                 description: ID of the trusted contact invitation
 *                 example: 123
 *     responses:
 *       200:
 *         description: Invitation deleted successfully
 */
router.post("/delete-contact-invitation", async (req, res) => {
    const response = await TrustedContactController.deleteTrustedContactInvitation({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});



router.get("/get-trusted-contact-devices-tokens", async (req, res) => {
    const response = await TrustedContactController.getTrustedContactDevicesTokens({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/trusted-contact/chat-contact-friend-list:
 *   get:
 *     summary: Get trusted contacts available for chat friend list
 *     tags:
 *       - Add trusted contact routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Chat contact friend list fetched successfully
 */
router.get("/chat-contact-friend-list", async (req, res) => {
  const response = await TrustedContactController.chatContactFriendList({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});


/**
 * @swagger
 * /api-mobile/auth/trusted-contact/contacts-get-locations:
 *   get:
 *     summary: Get locations of trusted contacts
 *     tags:
 *       - Add trusted contact routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Locations of trusted contacts fetched successfully
 */
router.get("/contacts-get-locations", async (req, res) => {
  const response = await TrustedContactController.getTrustedContactsLocations({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
})
export default router;