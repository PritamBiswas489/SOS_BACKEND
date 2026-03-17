import CurrencyService from "../services/currency.service.js";
import "../config/environment.js";
// cronJob.js
import cron from 'node-cron';

// Your scheduled task
const updateCurrencyRates = async () => {
    console.log('Cron Job Running at 1 AM:', new Date().toLocaleString());
    try {
        await CurrencyService.insertOrUpdateCurrency();
        console.log('Currency rates updated successfully');
    } catch (error) {
        console.error('Error updating currency rates:', error);
    }
};

// Schedule the task to run every day at 12:30 PM
cron.schedule('30 12 * * *', () => {
    updateCurrencyRates();
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE
});
console.log('Cron job scheduled to run every day at 1 AM');
