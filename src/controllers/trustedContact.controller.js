import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import "../config/environment.js";
import TrustedContactService from "../services/trustedContact.service.js";

export default class TrustedContactController {
  static async sendTrustedContactInvitation(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.sendTrustedContactInvitation(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "SEND_INVITATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("SEND_INVITATION_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async acceptTrustedContactInvitation(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.acceptTrustedContactInvitation(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "ACCEPT_INVITATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }

          return resolve({ 
            status: 200,
            data: response.data,
            message: headers?.i18n.__("ACCEPT_INVITATION_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async cancelTrustedContactInvitation(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.cancelTrustedContactInvitation(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "CANCEL_INVITATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("CANCEL_INVITATION_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async getPendingIncommingTrustedContactInvitations(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.getPendingIncommingTrustedContactInvitations(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_PENDING_INVITATIONS_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_PENDING_INVITATIONS_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async getPendingOutgoingTrustedContactInvitations(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.getPendingOutgoingTrustedContactInvitations(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_PENDING_OUTGOING_INVITATIONS_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__(
              "GET_PENDING_OUTGOING_INVITATIONS_SUCCESSFUL",
            ),
            error: null,
          });
        },
      );
    });
  }
  static async getTrustedContacts(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.getTrustedContacts(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_TRUSTED_CONTACTS_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("GET_TRUSTED_CONTACTS_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async deleteTrustedContactInvitation(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.deleteTrustedContactInvitation(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "DELETE_INVITATION_FAILED",
                ),
                reason: err.message,
              },
            });
          }

          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__("DELETE_INVITATION_SUCCESSFUL"),
            error: null,
          });
        },
      );
    });
  }
  static async getTrustedContactDevicesTokens(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.getTrustedContactDevicesTokens(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_TRUSTED_CONTACTS_DEVICES_TOKENS_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__(
              "GET_TRUSTED_CONTACTS_DEVICES_TOKENS_SUCCESSFUL",
            ),
            error: null,
          });
        },
      );
    });
  }
  static async chatContactFriendList(request) {
    const { payload, headers, user } = request;
    const userid = user?.id;
    return new Promise((resolve) => {
      TrustedContactService.chatContactFriendList(
        { userid, payload, headers },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: headers?.i18n.__(
                  err.message || "GET_CHAT_CONTACT_FRIEND_LIST_FAILED",
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: headers?.i18n.__(
              "GET_CHAT_CONTACT_FRIEND_LIST_SUCCESSFUL",
            ),
            error: null,
          });
        },
      );
    });
  }
}
