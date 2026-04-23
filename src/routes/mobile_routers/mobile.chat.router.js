import "../../config/environment.js";
import express from "express";
import {
  uploadChatMedia,
  getMediaType,
} from "../../middlewares/chatMediaupload.js";
import ChatController from "../../controllers/chat.controller.js";
const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/chat/upload-media:
 *   post:
 *     summary: Upload media file for chat
 *     tags:
 *       - Chat with trusted contact routes
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
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Media file to upload (image, video, audio, document).
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Media uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     media_url:
 *                       type: string
 *                       example: "https://example.com/uploads/chat/image123.jpg"
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post("/upload-media", (req, res) => {
  uploadChatMedia.single("file")(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
     
    const response = await ChatController.uploadChatMedia({
      file: req.file,
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
    
      user: req.user,
    });
    res.return(response);
  });
});


/**
 * @swagger
 * /api-mobile/auth/chat/chat-history:
 *   get:
 *     summary: Get chat message history for a room
 *     tags:
 *       - Chat with trusted contact routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The chat room ID to fetch messages for
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to return per page
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat history retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       senderId:
 *                         type: integer
 *                         example: 42
 *                       recipientId:
 *                         type: integer
 *                         example: 99
 *                       text:
 *                         type: string
 *                         example: "Hello!"
 *                       mediaUrl:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/uploads/chat/image.jpg"
 *                       mediaType:
 *                         type: string
 *                         nullable: true
 *                         example: "image"
 *                       replyTo:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                       status:
 *                         type: string
 *                         example: "delivered"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-04-23T10:00:00.000Z"
 *                       locationJson:
 *                         type: object
 *                         nullable: true
 *                         example: null
 *                       reply_to_message:
 *                         type: object
 *                         nullable: true
 *       400:
 *         description: Bad request — missing or invalid roomId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/chat-history", async (req, res) => {
  const response = await ChatController.getChatHistory({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

export default router;
