import "../config/environment.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import db from "../databases/models/index.js";

const { EmergencyServices,  } = db;

export default class EmergencyServicesService {
    static async requestRegisterNewEmergencyService({ payload, userid }, callback) {
        console.log("Requesting registration of a new emergency service with payload:", payload, "for user ID:", userid);

        try {
            const requiredFields = [
                "locationName",
                "latitude",
                "longitude",
                "address",
                "phoneNumber",
                "placeId",
                "serviceType",
            ];
            const missingField = requiredFields.find((field) => {
                const value = payload?.[field];
                return value === undefined || value === null || value === "";
            });

            if (missingField) {
                return callback(new Error(`${missingField.toUpperCase()}_IS_REQUIRED`), null);
            }

            const latitude = Number(payload.latitude);
            const longitude = Number(payload.longitude);

            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
                return callback(new Error("VALID_LATITUDE_IS_REQUIRED"), null);
            }

            if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                return callback(new Error("VALID_LONGITUDE_IS_REQUIRED"), null);
            }

            const checkingExistingServicebyPlaceId = await EmergencyServices.findOne({
                where: {
                    placeId: payload.placeId,
                },
            });

            if (checkingExistingServicebyPlaceId) {
                return callback(new Error("EMERGENCY_SERVICE_WITH_THIS_PLACE_ID_ALREADY_EXISTS"), null);
            }

            const emergencyService = await EmergencyServices.create({
                requestBy: userid || null,
                locationName: payload.locationName,
                latitude,
                longitude,
                address: payload.address,
                phoneNumber: payload.phoneNumber,
                placeId: payload.placeId,
                serviceType: payload.serviceType,
                status: "approved",
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
            });

            return callback(null, {
                data: emergencyService,
                message: "REQUEST_REGISTER_NEW_EMERGENCY_SERVICE_SUCCESSFUL",
            });
        } catch (error) {
            logger.error("ERROR In requestRegisterNewEmergencyService", { error });
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
            return callback(new Error("REQUEST_REGISTER_NEW_EMERGENCY_SERVICE_FAILED"), null);
        }
    }
    static async getNearbyEmergencyServices({ payload }, callback) {
        console.log("Getting nearby emergency services with payload:", payload);
        const latitude = Number(payload.latitude);
        const longitude = Number(payload.longitude);
        const radius = Number(payload.radius) || 5000;
        const limit = 100;

        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            return callback(new Error("VALID_LATITUDE_IS_REQUIRED"), null);
        }
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            return callback(new Error("VALID_LONGITUDE_IS_REQUIRED"), null);
        }
        const serviceType = payload.serviceType || null;
        const locations = await db.sequelize.query(
            `
  SELECT *
FROM (
    SELECT
        id,
        "locationName",
        "serviceType",
        "phoneNumber",
        "latitude",
        "longitude",
        address,
        ROUND(
            (
                ST_Distance(
                    location,
                    ST_SetSRID(
                        ST_MakePoint(:lng, :lat),
                        4326
                    )::geography
                ) / 1000
            )::numeric,
            2
        ) AS distance_km
    FROM emergency_services
    WHERE ST_DWithin(
        location,
        ST_SetSRID(
            ST_MakePoint(:lng, :lat),
            4326
        )::geography,
        :radius
    )
    AND (
        :serviceType IS NULL
        OR "serviceType" = :serviceType
    )
) t
ORDER BY distance_km ASC
LIMIT :limit
  `,
            {
                replacements: {
                    lat: latitude,
                    lng: longitude,
                    radius: radius * 1000, // use the converted radius
                    serviceType,
                    limit 
                },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        return callback(null, {
            data: locations,
            message: "NEARBY_EMERGENCY_SERVICES_FETCHED_SUCCESSFULLY",
        });

    }

}