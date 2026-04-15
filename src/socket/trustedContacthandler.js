import moment from "moment";
import { promisify } from "../libraries/utility.js";
import TrustedContactService from "../services/trustedContact.service.js";
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
    if (validationError) {
      if (typeof ack === "function") {
        return ack({
          success: false,
          message: validationError?.error?.message || t.__("INVALID_INPUT"),
        });
      }
      return;
    }
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
      console.log("Received send:trustedContactRequest with payload:", payload);
      io.to(`app-user:${userId}`).emit("trustedContactRequest:sent", {
        success: true,
        message: t.__("SEND_INVITATION_SUCCESSFUL"),
      });
      const receiver_id = sendR?.data?.trusted_user_id;
      io.to(`app-user:${receiver_id}`).emit("trustedContactRequest:received", {
        success: true,
        message: "You have received a new trusted contact request",
      });
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
          message: t.__(err.message) || t.__("SEND_INVITATION_FAILED"),
          error: t.__(err.message) || t.__("SEND_INVITATION_FAILED"),
        });
      }
    }
  });
  socket.on("accept:trustedContactRequest", async (payload, ack) => {
    const userId = socket.userId;
    const acceptData = JSON.parse(payload);

    const accept = await promisify(
      TrustedContactService.acceptTrustedContactInvitation.bind(
        TrustedContactService,
      ),
      { userid: userId, payload: acceptData, headers: {} },
    ).catch((err) => {
      if (typeof ack === "function") {
        return ack({
          success: false,
          message: i18n.__(err.message) || i18n.__("ACCEPT_INVITATION_FAILED"),
        });
      }
    });
    if (accept) {
      io.to(`app-user:${userId}`).emit("trustedContactRequest:accepted", {
        success: true,
        message: i18n.__("ACCEPT_INVITATION_SUCCESSFUL"),
      });
      const requester_id = accept?.data?.user_id;
      io.to(`app-user:${requester_id}`).emit("trustedContactRequest:accepted", {
        success: true,
        message: i18n.__("ACCEPT_INVITATION_SUCCESSFUL"),
      });

      if (typeof ack === "function") {
        return ack({
          success: true,
          message: i18n.__("ACCEPT_INVITATION_SUCCESSFUL"),
        });
      }
    }
  });
  socket.on("delete:trustedContactRequest", async (payload, ack) => {
    const userId = socket.userId;
    const rejectData = JSON.parse(payload);
    const reject = await promisify(
      TrustedContactService.deleteTrustedContactInvitation.bind(
        TrustedContactService,
      ),
      { userid: userId, payload: rejectData, headers: {} },
    ).catch((err) => {
      if (typeof ack === "function") {
        return ack({
          success: false,
          message: i18n.__(err.message) || i18n.__("REJECT_INVITATION_FAILED"),
        });
      }
    });
    if (reject) {
      io.to(`app-user:${userId}`).emit("trustedContactRequest:deleted", {
        success: true,
        message: i18n.__("REJECT_INVITATION_SUCCESSFUL"),
      });

      const requester_id = reject?.data?.user_id;
      io.to(`app-user:${requester_id}`).emit("trustedContactRequest:deleted", {
        success: true,
        message: i18n.__("REJECT_INVITATION_SUCCESSFUL"),
      });
      if (typeof ack === "function") {
        return ack({
          success: true,
          message: i18n.__("REJECT_INVITATION_SUCCESSFUL"),
        });
      }
    }
  });
};
