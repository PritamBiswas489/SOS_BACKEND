import moment from "moment";
import { promisify } from "../libraries/utility.js";
import UserLocationService from "../services/userLocation.service.js";
import TrustedContactService from "../services/trustedContact.service.js";
import db from "../databases/models/index.js";
const { TrustedContacts } = db;

 

export const registerLocationHandlers = (io, socket) => {

    // ─── location:update ────────────────────────────────────────────────────────
    // Payload: { loc: { latitude, longitude, altitude?, accuracy?, heading?, speed?, isBackground? }, roomId?, shareWithContacts? }
    // - Persists the location to history.
    // - Broadcasts to a specific roomId (chat / SOS room) when provided.
    // - Fans out to personal rooms of all accepted trusted contacts with share_location=true
    //   when shareWithContacts is true (or omitted / undefined — defaults to true).
    socket.on('location:update', async (locationData, ack) => {
        try {
            const payload = JSON.parse(locationData);
            
            let locObject = payload?.loc || null;
            const shareWithContacts = payload?.shareWithContacts !== false; // default true

            if (!locObject?.latitude) {
                // Choose random location from predefined list if latitude is missing
                const { locations } = await import("../libraries/locations.js");
                const randomIndex = Math.floor(Math.random() * locations.length);
                locObject = locations[randomIndex];
            } 
            if (locObject?.latitude && locObject?.longitude) {
                console.log("======== Location update==============", locObject);
                // Persist asynchronously — don't block broadcasting
                promisify(
                    UserLocationService.createLocationHistory.bind(UserLocationService),
                    { userId: socket.userId, locationData: locObject }
                ).catch((err) => console.error("Error creating location history:", err));

                // Fan-out to trusted contacts' personal rooms
                if (shareWithContacts) {
                    
                    // Emit to user's own personal room so they can see their updated location on their UI immediately
                    io.to(`app-user:${socket.userId}`).emit('location:my-updated', {
                            location: locObject,
                    });
                    const contactIds = await TrustedContactService.getLocationShareContactIds(socket.userId);
                    const uniqueContactIds = [...new Set(contactIds)];
                    for (const contactId of uniqueContactIds) {
                        console.log(`Emitting location update from user ${socket.userId} to contact ${contactId} in room app-user:${contactId}`);
                        io.to(`app-user:${contactId}`).emit('location:updated', {
                            userId: socket.userId,
                            location: locObject,
                        });
                    }
                }
            }
            if (typeof ack === "function") {
                ack({ success: true });
            }
        } catch (err) {
            console.error("Error handling location:update:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to process location update" });
            }
        }
    });
    socket.on("contacts:get-locations", async (_, ack) => {
        try {
            const contactIds = await TrustedContactService.getLocationShareContactIds(socket.userId);
            const uniqueContactIds = [...new Set(contactIds)];
            console.log(`Fetching latest locations for contacts of user ${socket.userId}:`, uniqueContactIds); 
            const contacts = await promisify(
                UserLocationService.getContactsLocation.bind(UserLocationService),
                uniqueContactIds,
            ).catch((_err) => { 
               throw new Error("Failed to fetch contacts' locations");
            });

            if (typeof ack === "function") {
                 console.log("Ack contacts", JSON.stringify(contacts));
                ack({ success: true, contacts });
            }
        } catch (err) {
            console.error("Error handling contacts:get-locations:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to get contacts' locations" });
            }
        }
    });


    // ─── location:share:start ────────────────────────────────────────────────────
    // Notifies all accepted trusted contacts (share_location=true) that this user
    // has started sharing their live location.
    // Emitted event to contacts: 'location:share:started' { userId, userName }
    socket.on('location:share:start', async (_, ack) => {
        try {
            const contactIds = await TrustedContactService.getLocationShareContactIds(socket.userId);
            for (const contactId of contactIds) {
                io.to(`app-user:${contactId}`).emit('location:share:started', {
                    userId: socket.userId,
                    userName: socket.userName,
                });
            }
            console.log(`User ${socket.userId} started location sharing with ${contactIds.length} contacts`);
            if (typeof ack === "function") {
                ack({ success: true, notifiedContacts: contactIds.length });
            }
        } catch (err) {
            console.error("Error handling location:share:start:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to start location sharing" });
            }
        }
    });

    // ─── location:share:stop ─────────────────────────────────────────────────────
    // Notifies all accepted trusted contacts (share_location=true) that this user
    // has stopped sharing their live location.
    // Emitted event to contacts: 'location:share:stopped' { userId, userName }
    socket.on('location:share:stop', async (_, ack) => {
        try {
            const contactIds = await TrustedContactService.getLocationShareContactIds(socket.userId);
            for (const contactId of contactIds) {
                io.to(`app-user:${contactId}`).emit('location:share:stopped', {
                    userId: socket.userId,
                    userName: socket.userName,
                });
            }
            console.log(`User ${socket.userId} stopped location sharing with ${contactIds.length} contacts`);
            if (typeof ack === "function") {
                ack({ success: true, notifiedContacts: contactIds.length });
            }
        } catch (err) {
            console.error("Error handling location:share:stop:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to stop location sharing" });
            }
        }
    });

    // ─── location:request ────────────────────────────────────────────────────────
    // A trusted contact requests the current location of targetUserId.
    // The request is forwarded to the target's personal room as 'location:requested'.
    // The target is expected to respond by emitting a location:update.
    // Payload: { targetUserId: number|string }
    socket.on('location:request', async (data, ack) => {
        try {
            const { targetUserId } = JSON.parse(data);
            if (!targetUserId) {
                if (typeof ack === "function") {
                    return ack({ success: false, message: "targetUserId is required" });
                }
                return;
            }

            // Verify requester is an accepted trusted contact of the target with share_location=true
            const contact = await TrustedContacts.findOne({
                where: {
                    status: "accepted",
                    share_location: true,
                    [db.Sequelize.Op.or]: [
                        { user_id: socket.userId, trusted_user_id: targetUserId },
                        { user_id: targetUserId, trusted_user_id: socket.userId },
                    ],
                },
            });

            if (!contact) {
                if (typeof ack === "function") {
                    return ack({ success: false, message: "Not authorized to request this user's location" });
                }
                return;
            }

            io.to(`app-user:${targetUserId}`).emit('location:requested', {
                requestedBy: socket.userId,
                requestedByName: socket.userName,
            });

            if (typeof ack === "function") {
                ack({ success: true });
            }
        } catch (err) {
            console.error("Error handling location:request:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to send location request" });
            }
        }
    });

    // ─── location:request:accept ─────────────────────────────────────────────────
    // Target user accepts a location request from a trusted contact.
    // Notifies the requester that the target accepted, then the target should follow
    // up immediately with a location:update so the requester receives the position.
    // Payload: { requestedByUserId: number|string }
    socket.on('location:request:accept', async (data, ack) => {
        try {
            const { requestedByUserId } = JSON.parse(data);
            if (!requestedByUserId) {
                if (typeof ack === "function") {
                    return ack({ success: false, message: "requestedByUserId is required" });
                }
                return;
            }

            // Verify the relationship still exists and share_location is enabled
            const contact = await TrustedContacts.findOne({
                where: {
                    status: "accepted",
                    share_location: true,
                    [db.Sequelize.Op.or]: [
                        { user_id: socket.userId, trusted_user_id: requestedByUserId },
                        { user_id: requestedByUserId, trusted_user_id: socket.userId },
                    ],
                },
            });

            if (!contact) {
                if (typeof ack === "function") {
                    return ack({ success: false, message: "Not authorized" });
                }
                return;
            }

            // Notify the requester that the target accepted — their UI can show a "waiting for location..." state
            io.to(`app-user:${requestedByUserId}`).emit('location:request:accepted', {
                acceptedBy: socket.userId,
                acceptedByName: socket.userName,
            });

            if (typeof ack === "function") {
                ack({ success: true });
            }
        } catch (err) {
            console.error("Error handling location:request:accept:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to accept location request" });
            }
        }
    });

    // ─── location:request:decline ────────────────────────────────────────────────
    // Target user declines a location request from a trusted contact.
    // Notifies the requester so their UI can stop waiting.
    // Payload: { requestedByUserId: number|string }
    socket.on('location:request:decline', async (data, ack) => {
        try {
            const { requestedByUserId } = JSON.parse(data);
            if (!requestedByUserId) {
                if (typeof ack === "function") {
                    return ack({ success: false, message: "requestedByUserId is required" });
                }
                return;
            }

            io.to(`app-user:${requestedByUserId}`).emit('location:request:declined', {
                declinedBy: socket.userId,
                declinedByName: socket.userName,
            });

            if (typeof ack === "function") {
                ack({ success: true });
            }
        } catch (err) {
            console.error("Error handling location:request:decline:", err);
            if (typeof ack === "function") {
                ack({ success: false, message: "Failed to decline location request" });
            }
        }
    });
}