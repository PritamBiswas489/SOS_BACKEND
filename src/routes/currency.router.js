import "../config/environment.js";
import express from "express";
const router = express.Router();
import CurrencyController from "../controllers/currency.controller.js";
import trackIpAddressDeviceId from '../middlewares/trackIpAddressDeviceId.js';
import * as Sentry from "@sentry/node";
import { paymentCurrencies } from "../config/paymentCurrencies.js";
router.use(trackIpAddressDeviceId);
/**
 * @swagger
 * /api/currency/fixerExchangeRates:
 *   get:
 *     summary: Get exchange rates from Fixer.io
 *     tags:
 *       - Currency routes
 *     responses:
 *       200:
 *         description: Success - Exchange rates retrieved
 */
router.get("/fixerExchangeRates", async (req, res, next) => {
  const exchangeRates = await CurrencyController.fixerExchangeRates({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(exchangeRates);
});

/**
 * @swagger
 * /api/currency/rateByCode:
 *   get:
 *     summary: Get currency rate by code
 *     tags:
 *       - Currency routes
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: ILS_TO_THB
 *     responses:
 *       200:
 *         description: Success - Currency rate retrieved
 *       400:
 *         description: Bad Request - Missing or invalid currency code
 *       500:
 *         description: Internal Server Error
 */

router.get("/rateByCode", async (req, res, next) => {
  const currency = await CurrencyController.getCurrencyByCode({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(currency);
});
/**
 * @swagger
 * /api/currency/allCurrencies:
 *   get:
 *     summary: Get all currencies
 *     tags:
 *       - Currency routes
 *     responses:
 *       200:
 *         description: Success - All currencies retrieved
 *       500:
 *         description: Internal Server Error
 */
router.get("/allCurrencies", async (req, res, next) => {
  const currencies = await CurrencyController.getAllCurrencies({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(currencies);
});

/**
 * @swagger
 * /api/currency/amount-convert-to-thb:
 *   post:
 *     summary: Convert amount(s) to THB
 *     tags:
 *       - Currency routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               fromCurrency:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ILS", "USD", "EUR"]
 *     responses:
 *       200:
 *         description: Success - Amount(s) converted to THB
 */

router.post("/amount-convert-to-thb", async (req, res, next) => {
  try {
    const result = await CurrencyController.convertToTHB({
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
    });
    res.return(result);
  } catch (e) {
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
    res.return({
      status: 500,
      data: [],
      error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
    });
  }
});

/**
 * @swagger
 * /api/currency/amount-from-thb-to-another:
 *   post:
 *     summary: Convert amount(s) from THB to another currency
 *     tags:
 *       - Currency routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               toCurrency:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ILS", "USD", "EUR"]
 *     responses:
 *       200:
 *         description: Success - Amount(s) converted from THB
 */

router.post("/amount-from-thb-to-another", async (req, res, next) => {
  try {
    const result = await CurrencyController.convertFromTHB({
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
    });
    res.return(result);
  } catch (e) {
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
    res.return({
      status: 500,
      data: [],
      error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
    });
  }
});


/**
 * @swagger
 * /api/currency/converter-wallet-cur-to-payment-cur:
 *   post:
 *     summary: Convert currency from one to another
 *     tags:
 *       - Currency routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromCurrency:
 *                 type: string
 *                 example: "USD"
 *               toCurrency:
 *                 type: string
 *                 example: "THB"
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Success - Currency converted
 *       500:
 *         description: Internal Server Error
 */
router.post("/converter-wallet-cur-to-payment-cur", async (req, res, next) => {
  try {
    const result = await CurrencyController.currencyConverterWalletCurToPaymentCur({
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
    });
    res.return(result);
  } catch (e) {
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
    res.return({
      status: 500,
      data: [],
      error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
    });
  }
});
/**
 * @swagger
 * /api/currency/converter-payment-cur-to-wallet-cur:
 *   post:
 *     summary: Convert currency from one to another
 *     tags:
 *       - Currency routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromCurrency:
 *                 type: string
 *                 example: "THB"
 *               toCurrency:
 *                 type: string
 *                 example: "USD"
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Success - Currency converted
 *       500:
 *         description: Internal Server Error
 */
router.post("/converter-payment-cur-to-wallet-cur", async (req, res, next) => {
  try {
    const result = await CurrencyController.currencyConverterPaymentCurToWalletCur({
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
    });
    res.return(result);
  } catch (e) {
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
    res.return({
      status: 500,
      data: [],
      error: { message: i18n.__("CATCH_ERROR"), reason: e.message },
    });
  }
});
/**
 * @swagger
 * /api/currency/get-payment-currencies:
 *   get:
 *     summary: Get supported payment currencies
 *     tags:
 *       - Currency routes
 *     responses:
 *       200:
 *         description: Success - Payment currencies retrieved
 */
router.get("/get-payment-currencies", async (req, res, next) => {
  const filteredPaymentCurrencies = Object.fromEntries(
    Object.entries(paymentCurrencies).filter(([key, value]) => key !== 'USD')
  );
  res.return(filteredPaymentCurrencies);
});

/**
 * @swagger
 * /api/currency/get-bankhapoalim-exchange-rate:
 *   get:
 *     summary: Get exchange rate from Bank Hapoalim
 *     tags:
 *       - Currency routes
 *     responses:
 *       200:
 *         description: Success - Exchange rate retrieved
 *       500:
 *         description: Internal Server Error
 */
router.get("/get-bankhapoalim-exchange-rate", async (req, res, next) => {
  const exchangeRate = await CurrencyController.getBankHapoalimExchangeRate({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(exchangeRate);


});

export default router;
