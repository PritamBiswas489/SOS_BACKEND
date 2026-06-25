import TrustedContactService from "../services/trustedContact.service.js";
import "../config/environment.js"
import * as Sentry from "@sentry/node";

export const registerHealthHandler = (io, socket) => {

    socket.on('contact:healthdata:update', async (data, ack) => {
        try {
            let healthData = data;
            if (typeof data !== 'object') {
                healthData = JSON.parse(data);
            }
            const contactIds = await TrustedContactService.getLocationShareContactIds(socket.userId);
            const uniqueContactIds = [...new Set(contactIds)];
            for (const contactId of uniqueContactIds) {
                console.log(`Emitting health data update from user ${socket.userId} to contact ${contactId} in room app-user:${contactId}`);
                io.to(`app-user:${contactId}`).emit('contact:healthdata:updated', {
                    userId: socket.userId,
                    healthData,
                });
            }

        } catch (err) {
            console.error("[Health] contact:healthdata:update error", err);
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(err);
            

        }

    });


}