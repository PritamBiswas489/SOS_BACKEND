import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import fs from "fs";
import path from "path";

const { Op, User, UserLocationHistory } = db;

//Update user location history
export default class UserLocationService {
    //Create a new location history entry for a user
    static async createLocationHistory({userId, locationData}, callback) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                const error = new Error(`User with ID ${userId} not found`);
                logger.error(error.message);
                return callback(error);
            }
            user.latitude = locationData?.latitude;
            user.longitude = locationData?.longitude;
            await user.save();
            const locationHistory = await UserLocationHistory.create({
                user_id: userId,
                latitude: locationData?.latitude,
                longitude: locationData?.longitude,
                altitude: locationData?.altitude,
                accuracy: locationData?.accuracy,
                heading: locationData?.heading,
                speed: locationData?.speed,
                isBackground: locationData?.isBackground || false,
            });
            logger.info(`Location history created for user ${userId} with location data: ${JSON.stringify(locationData)}`);
            callback(null, locationHistory);
        }catch (error) {            
            logger.error(`Error creating location history for user ${userId}: ${error.message}`);
             process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            callback(error);
        }
    }
    static async getContactsLocation(contactIds, callback) {
        try {
            let locations = [];
            for (const contactId of contactIds) {
               const location = await UserLocationHistory.findOne({
                    where: { user_id: contactId },
                    order: [['created_at', 'DESC']],
                });
                if (location) {
                    locations.push(location);
                }
            }
            console.log(`Fetched locations for contacts: ${JSON.stringify(locations)}`);
            callback(null, locations);
        }catch (error) {
            logger.error(`Error fetching contacts location: ${error.message}`);
             process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            callback(error);
        }
    }
}