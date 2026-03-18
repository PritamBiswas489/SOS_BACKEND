import "../config/environment.js";
import express from "express";
import SuggestionController from "../controllers/suggestion.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/suggestion/get-suggestion-types:
 *   get:
 *     summary: Get suggestion types
 *     tags: [Suggestion routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Successfully retrieved suggestion types
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
router.get("/get-suggestion-types", async (req, res, next) => {
    const response = await SuggestionController.getSuggestionTypes({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 * /api/auth/suggestion/get-suggestion-priority-level:
 *   get:
 *     summary: Get suggestion priority levels
 *     tags: [Suggestion routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Successfully retrieved suggestion priority levels
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
router.get("/get-suggestion-priority-level", async (req, res, next) => {
    const response = await SuggestionController.getSuggestionPriorityLevels({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 * /api/auth/suggestion/submit-suggestion:
 *   post:
 *     summary: Submit a suggestion
 *     tags: [Suggestion routes]
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
 *               typeId:
 *                 type: integer
 *                 description: Type ID of the suggestion
 *                 example: 16
 *               suggestion:
 *                 type: string
 *                 description: The suggestion text
 *                 example: "demo suggestion example"
 *               description:
 *                 type: string
 *                 description: Description of the suggestion
 *                 example: "This is a demo description for the suggestion."
 *               levelId:
 *                 type: integer
 *                 description: Priority level ID of the suggestion
 *                 example: 9
 *               email:
 *                 type: string
 *                 description: Email address
 *                 example: "demo@example.com"
 *     responses:
 *       200:
 *         description: Successfully submitted suggestion
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
router.post("/submit-suggestion", async (req, res, next) => {
    const response = await SuggestionController.submitSuggestion({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




/**
 * @swagger
 * /api/auth/suggestion/get-my-suggestions:
 *   get:
 *     summary: Get my suggestions
 *     tags: [Suggestion routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved my suggestions
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
router.get("/get-my-suggestions", async (req, res, next) => {
    const response = await SuggestionController.getMySuggestions({ headers: req.headers, user: req.user, payload: { ...req.body, ...req.query } });
    res.return(response);
});



/**
 * @swagger
 * /api/auth/suggestion/get-all-suggestions:
 *   get:
 *     summary: Get all suggestions
 *     tags: [Suggestion routes]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved all suggestions
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
router.get("/get-all-suggestions", async (req, res, next) => {
    const response = await SuggestionController.getAllSuggestions({ headers: req.headers, user: req.user, payload: { ...req.body, ...req.query } });
    res.return(response);
});



export default router;