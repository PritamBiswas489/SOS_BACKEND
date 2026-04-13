import moment from "moment";
import { getSocketIdsForUser } from "./index.js";
import ChatService from "../services/chat.service.js";
import { promisify } from "../libraries/utility.js";
import UserService from "../services/user.service.js";
import TrustedContactService from "../services/trustedContact.service.js";
import { enqueueBulk } from "../queues/notificationQueue.js";
import { sendTrustedContactInvitationValidator } from "../validators/trustedContact.validator.js";
import i18n from "../config/i18.config.js";

export const registerTrustedContactHandler = (io, socket) => {
    socket.on("send:trustedContactRequest", async (requestData, ack) => {
        const userId = socket.userId;
        const lang = socket?.handshake?.headers?.["x-api-language"] || "en";
        i18n.setLocale(lang);
        const t = i18n;
        const payload = JSON.parse(requestData);
        // Validate input data
        const insertedData = {
                name: payload?.name,
                mobile_number: payload?.mobile_number,
                relationship: payload?.relationship,
                sos_alert: payload?.sos_alert,
                share_location: payload?.share_location,
        };
         const [validationError] = await sendTrustedContactInvitationValidator(
            insertedData,
            t,
         );
         if(validationError){
            if (typeof ack === "function") {
              return ack({
                success: false,
                message: validationError?.error?.message || t.__("INVALID_INPUT"),
              });
            }
            return;
         }

        const senderSocketIds = getSocketIdsForUser(userId);
        const targetSocketIds = senderSocketIds.length > 0 ? senderSocketIds : [socket.id];
        try {
         const sendR = await new Promise((resolve, reject) => {
            TrustedContactService.sendTrustedContactInvitation(
              { userid: userId, payload },
              (err, result) => {
                if (err) {
                  reject(err);
                  return;
                }
                console.log(
                  "Trusted contact invitation sent successfully:",
                  result,
                );
                resolve(result);
              },
            );
          });
          console.log(
            "Received send:trustedContactRequest with payload:",
            payload,
          );
          console.log("senderSocketIds", targetSocketIds);
          for (const socketId of targetSocketIds) {
            console.log(
              `Emitting trustedContactRequest:sent to socket ${socketId} for user ${userId}`,
            );
            io.to(socketId).emit("trustedContactRequest:sent", {
              success: true,
              message: t.__("SEND_INVITATION_SUCCESSFUL"),
            });
          }
          const receiver_id  = sendR?.data?.trusted_user_id;
          console.log("Receiver ID for trusted contact request:", receiver_id);
          const receiverSocketIds = getSocketIdsForUser(receiver_id);
          if (receiver_id) {
            for (const socketId of receiverSocketIds) {
              io.to(socketId).emit("trustedContactRequest:received", {
                success: true,
                message: "You have received a new trusted contact request",
              });
            }
          }
          if (typeof ack === "function") {
            return ack({
              success: true,
              message: t.__("SEND_INVITATION_SUCCESSFUL"),
            });
          }
        } catch (err) {
          if (typeof ack === "function") {
            return ack({
              success: false,
              message:  t.__(err.message) || t.__("SEND_INVITATION_FAILED"),
              error: t.__(err.message) || t.__("SEND_INVITATION_FAILED"),
            });
          }
        }
    });
    socket.on("accept:trustedContactRequest", async (payload, ack) => {
        const userId = socket.userId;
        const  acceptData = JSON.parse(payload);

        const accept  = await promisify(
            TrustedContactService.acceptTrustedContactInvitation.bind(TrustedContactService),
            { userid: userId, payload: acceptData, headers: {} },
              
        ).catch((err) => {
            if (typeof ack === "function") {
                return ack({
                  success: false,
                  message: i18n.__(err.message) || i18n.__("ACCEPT_INVITATION_FAILED"),
                });
              }
        });
        if(accept){
            const senderSocketIds = getSocketIdsForUser(userId);
            console.log("receiver id",userId)
            console.log("senderSocketIds",senderSocketIds)
            for (const socketId of senderSocketIds) {
                io.to(socketId).emit("trustedContactRequest:accepted", {
                  success: true,
                  message: i18n.__("ACCEPT_INVITATION_SUCCESSFUL"),
                });
              }
              const requester_id  = accept?.data?.user_id;
              console.log("Requester ID", requester_id);
              const requesterSocketIds = getSocketIdsForUser(requester_id);
              console.log("requesterSocketIds", requesterSocketIds);
              if (requester_id) {
                for (const socketId of requesterSocketIds) {
                  io.to(socketId).emit("trustedContactRequest:accepted", {
                    success: true,
                    message: i18n.__("ACCEPT_INVITATION_SUCCESSFUL"),
                  });
                }
              }
        }
    });
    socket.on("reject:trustedContactRequest", async (payload, ack) => {
        const userId = socket.userId;
        const rejectData = JSON.parse(payload);
        const reject  = await promisify(
            TrustedContactService.deleteTrustedContactInvitation.bind(TrustedContactService),
            { userid: userId, payload: rejectData, headers: {} },
        ).catch((err) => {
            if (typeof ack === "function") {
                return ack({
                  success: false,
                  message: i18n.__(err.message) || i18n.__("REJECT_INVITATION_FAILED"),
                });
              }
        });
        if(reject){
            const senderSocketIds = getSocketIdsForUser(userId);
            console.log("receiver id",userId)
            console.log("senderSocketIds",senderSocketIds)
            for (const socketId of senderSocketIds) {
                io.to(socketId).emit("trustedContactRequest:deleted", {
                  success: true,
                  message: i18n.__("REJECT_INVITATION_SUCCESSFUL"),
                });
              }
                const requester_id  = reject?.data?.user_id;
                console.log("Requester ID", requester_id);
                const requesterSocketIds = getSocketIdsForUser(requester_id);
                console.log("requesterSocketIds", requesterSocketIds);
                if (requester_id) {
                  for (const socketId of requesterSocketIds) {
                    io.to(socketId).emit("trustedContactRequest:deleted", {
                      success: true,
                      message: i18n.__("REJECT_INVITATION_SUCCESSFUL"),
                    });
                  }
                }
        }
    });
}