import "../config/environment.js";
import express from "express";
import FeedbackController from "../controllers/feedback.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/feedback/get-feedback-categories:
 *   get:
 *     summary: Get feedback categories
 *     tags: [Feedback routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Successfully retrieved feedback categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/get-feedback-categories", async (req, res, next) => {
    const response = await FeedbackController.getFeedbackCategory({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 * /api/auth/feedback/submit-feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Feedback routes]
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
 *               - rating
 *               - categoryId
 *               - comment
 *               - email
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: Rating from 1 to 5
 *               categoryId:
 *                 type: string
 *                 example: "36"
 *                 description: ID of the feedback category
 *               comment:
 *                 type: string
 *                 example: "Great service, very satisfied!"
 *                 description: User feedback comment
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/submit-feedback", async (req, res, next) => {
    const response = await FeedbackController.submitFeedback({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 * /api/auth/feedback/get-my-feedbacks:
 *   get:
 *     summary: Get my feedbacks
 *     tags: [Feedback routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved user feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/get-my-feedbacks", async (req, res, next) => {
    const response = await FeedbackController.getMyFeedbacks({ headers: req.headers, user: req.user, payload: { ...req.body, ...req.query } });
    res.return(response);
});


/**
 * @swagger
 * /api/auth/feedback/get-all-feedbacks:
 *   get:
 *     summary: Get all feedbacks
 *     tags: [Feedback routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved all feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/get-all-feedbacks", async (req, res, next) => {
    
    const response = await FeedbackController.getAllFeedbacks({ headers: req.headers, user: req.user, payload: { ...req.body, ...req.query } });
    res.return(response);
});

export default router;