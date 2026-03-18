import '../config/environment.js';
import express from 'express';
import FavouriteQrCodeController from '../controllers/favouriteQrCode.controller.js';
const router = express.Router();


/**
 * @swagger
 * /api/auth/favourite/qrcodes:
 *   post:
 *     summary: List favourite QR codes
 *     tags: [Favourite QR Codes]
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
 *               country:
 *                 type: string
 *                 description: Filter by country
 *                 default: null
 *               qrCode:
 *                 type: string
 *                 description: Filter by QR code
 *                 default: null
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of items per page
 *                 default: 10
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 description: Page number
 *     responses:
 *       200:
 *         description: Successfully retrieved favourite QR codes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/qrcodes', async (req, res) => {
    const response = await FavouriteQrCodeController.listFavouriteQrCodes({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});
/**
 * @swagger
 * /api/auth/favourite/qrcodes/{id}:
 *   delete:
 *     summary: Remove favourite QR code
 *     tags: [Favourite QR Codes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The favourite QR code ID
 *     responses:
 *       200:
 *         description: Successfully removed favourite QR code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favourite QR code not found
 *       500:
 *         description: Internal server error
 */
router.delete('/qrcodes/:id', async (req, res) => {
    const response = await FavouriteQrCodeController.removeFavouriteQrCode({ headers: req.headers, user: req.user, payload: { id: req.params.id } });
    res.return(response);
});

export default router;
