import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
const {  Op, User, ApiLogs  } = db;

export default class TrackIpAddressDeviceIdService {

    static async createTrackIpAddressDeviceId(trackData) {
        try {
            const newTrack = await ApiLogs.create(trackData);
            // console.log({ SUCCESS: 1, data: newTrack });

        } catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            console.error("Error creating track IP address and device ID:", e.message);
        }
    }
    static async getTrackByIpAddress(ipAddress) {
        try {
            const tracks = await ApiLogs.findOne({
                where: {
                    ip: ipAddress
                }
            });
           return { SUCCESS: 1, data: tracks };
        } catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            console.error("Error fetching tracks by IP address:", e.message);
        }
    }
    static async getApiEndpointLogs( payload) {
        try {
            const { page = 1, limit = 10 } = payload;
            const offset = (page - 1) * limit;

            const logs = await ApiLogs.findAndCountAll({
                order: [["createdAt", "DESC"]],
                offset: offset,
                limit: limit,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email", "phoneNumber"],
                    }
                ]
            });

            return {
                SUCCESS: 1,
                data: logs.rows,
                count: logs.count,
                totalPages: Math.ceil(logs.count / limit),
                currentPage: page
            };
        } catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            console.error("Error fetching API endpoint logs:", e.message);
            return { ERROR: e.message };
        }

    }


 }

