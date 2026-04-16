import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import UserService from "./user.service.js";
const { Op, User, TrustedContacts, Devices } = db;
import { enqueueBulk } from "../queues/notificationQueue.js";
import { promisify } from "../libraries/utility.js";
import path from "path";
import fs from "fs";

export default class TrustedContactService {
  //send trusted contact invitation
  static async sendTrustedContactInvitation(
    { userid, payload },
    callback,
  ) {
    console.log("Sending trusted contact invitation for user ID:", userid);
    console.log("Payload:", payload);
    try {

    //check 10 trusted contacts limit
    const trustedContactCount = await TrustedContacts.count({
      where: {
        user_id: userid,
        status: "accepted",
      },
    });
    if (trustedContactCount >= 10) {
      return callback(new Error("TRUSTED_CONTACT_LIMIT_REACHED"), null);
    }

      const { name, mobile_number, relationship, sos_alert, share_location } = payload;
      const getUser = await User.findOne({
        where: { phone_number: mobile_number, role: "USER", is_active: true },
      });
      if (!getUser) {
        return callback(
          new Error("THIS_MOBILE_NUMBER_IS_NOT_REGISTERED"),
          null,
        );
      }
      if (getUser.id === userid) {
        return callback(
          new Error("CANNOT_ADD_YOURSELF_AS_TRUSTED_CONTACT"),
          null,
        );
      }

      //Now we can add the trusted contact to the user's trusted contact list
      const checkExistingContact = await TrustedContacts.findOne({
        where: {
          [Op.or]: [
            {
              user_id: userid,
              trusted_user_id: getUser.id,
            },
            {
              user_id: getUser.id,
              trusted_user_id: userid,
            },
          ],
        },
      });
       
      if (checkExistingContact) {
         
        console.log("userid",userid);
        console.log({userId :  checkExistingContact.user_id, trustedUserId: checkExistingContact.trusted_user_id, status: checkExistingContact.status});
        console.log("Existing trusted contact found:", checkExistingContact.toJSON());
          if(checkExistingContact.status === "pending" && userid === checkExistingContact.user_id){
             
            return callback(new Error("TRUSTED_CONTACT_INVITATION_ALREADY_SENT"), null);
          }
          else if(checkExistingContact.status === "pending" && userid === checkExistingContact.trusted_user_id){
             
               return callback(new Error("TRUSTED_CONTACT_INVITATION_PENDING_FROM_OTHER_USER"), null);
          }
          else if(checkExistingContact.status === "accepted"){
              return callback(new Error("TRUSTED_CONTACT_ALREADY_EXISTS"), null);
          }
      }
    
      const newTrustedContact = await TrustedContacts.create({
        user_id: userid,
        trusted_user_id: getUser.id,
        nickname: name,
        relationship: relationship,
        sos_alert: sos_alert,
        share_location: share_location,
      });
      console.log(
        "Trusted contact invitation sent successfully:",
        newTrustedContact,
      );

       let recipientDeviceTokens = [];
       recipientDeviceTokens = await promisify(
           UserService.getUserDeviceTokens.bind(UserService),
           getUser.id,
         ).catch((err) => {});

         if(recipientDeviceTokens.length > 0){
            enqueueBulk(recipientDeviceTokens, {
              title: "New Trusted Contact Invitation",
              body: `You have received a trusted contact invitation from ${newTrustedContact.nickname || "a user"}.`,
              data: { invitationId: newTrustedContact.id, messageType: "NEW_TRUSTED_CONTACT_INVITATION" },
            });
         }
      return callback(null, { data: newTrustedContact });
    } catch (error) {
      logger.error("ERROR In sendTrustedContactInvitation", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("SEND_INVITATION_FAILED"), null);
    }
  }
  //chat contact friend list
  static async chatContactFriendList({ userid }, callback) {
    try {
      const friends = await TrustedContacts.findAll({
        where: {
          status: "accepted",
          [Op.or]: [
            { user_id: userid },
            { trusted_user_id: userid }
          ]       
        },
        include: [
          {
            model: User,
            as: "trusted_contact",
            where: { is_active: true },
            attributes: ["id", "name", "phone_number", "profile_photo","is_online", "latitude", "longitude"],
            required: true,
          },
          {
            model: User,
            as: "inviter",
            where: { is_active: true },
            attributes: ["id", "name", "phone_number", "profile_photo","is_online", "latitude", "longitude"],
            required: true,
          },
        ],
      });
        const friendsData = friends.map((friend) => {
          const friendData = friend.toJSON();
          const trustedContactProfilePhoto = friendData.trusted_contact?.profile_photo;
          if (trustedContactProfilePhoto) {
            const imagePath = path.join(process.cwd(), "uploads", "profile_images", path.basename(trustedContactProfilePhoto));
            if (!fs.existsSync(imagePath)) {
              friendData.trusted_contact.profile_photo = null; // or set to a default avatar URL if you have one
            }else{
              friendData.trusted_contact.profile_photo = `${process.env.BASE_URL}/uploads/profile_images/${path.basename(trustedContactProfilePhoto)}`;
            }
          }
          const inviterProfilePhoto = friendData.inviter?.profile_photo;
          if (inviterProfilePhoto) {
            const imagePath = path.join(process.cwd(), "uploads", "profile_images", path.basename(inviterProfilePhoto));
            if (!fs.existsSync(imagePath)) {
              friendData.inviter.profile_photo = null; // or set to a default avatar URL if you have one
            }else{
              friendData.inviter.profile_photo = `${process.env.BASE_URL}/uploads/profile_images/${path.basename(inviterProfilePhoto)}`;
            }
          } 
          return friendData;
        });
      return callback(null, { data: friendsData });
    }catch (error) {
      logger.error("ERROR In chatContactFriendList", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_CHAT_CONTACT_FRIEND_LIST_FAILED"), null);
    }
    
      
  }
  //accept trusted contact invitation
  static async acceptTrustedContactInvitation(
    { userid, payload, headers },
    callback,
  ) {
    const transaction = await db.sequelize.transaction();
    try {
      const { id: invitationId } = payload;
      const invitation = await TrustedContacts.findOne(
        {
          where: {
            id: invitationId,
            trusted_user_id: userid,
          },
          include: [
            {
              model: User,
              as: "inviter",
              where: { is_active: true },
              attributes: ["id", "name", "phone_number"],
              required: true,
               include: [
                {
                  model: Devices,
                  as: "devices",
                  required: false,
                  attributes: ["id", "device_token", "device_type"],
                },
              ],
            },
            {
              model: User,
              as: "trusted_contact",
              where: { is_active: true },
              attributes: ["id", "name", "phone_number"],
             
              required: true,
            }
          ],
        },
        { 
            lock: transaction.LOCK.UPDATE,
            transaction 
        },
      );
      if (!invitation) {
         await transaction.rollback();
         return callback(new Error("INVITATION_NOT_FOUND"), null);
      }
      invitation.status = "accepted";
      await invitation.save({ transaction });


      const existingContacts = await TrustedContacts.findAll({
        where: {
          user_id: invitation.trusted_user_id,
          status: "accepted",
        },
        attributes: ["id"],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const trustedContactCount = existingContacts.length;

      if (trustedContactCount < 10) {
        await TrustedContacts.create(
          {
            user_id: invitation.trusted_user_id,
            trusted_user_id: invitation.user_id,
            nickname: invitation.inviter.name,
            relationship: invitation.relationship,
            status: "accepted",
          },
          {
            transaction,
          },
        );
      }

      await transaction.commit();

      if(invitation?.inviter && invitation?.inviter.devices) {
        for (const device of invitation.inviter.devices) {
          if (device.device_token) {
            enqueueBulk([device.device_token], {
              title: "Trusted Contact Invitation Accepted",
              body: `${invitation?.trusted_contact?.name || invitation?.trusted_contact?.phone_number} has accepted your trusted contact invitation.`,
              data: { invitationId: invitation.id, messageType: "ACCEPTED_TRUSTED_CONTACT" },
            });
            
          }
        }
      }
      return callback(null, { data: invitation });
    } catch (error) {
      await transaction.rollback();
      logger.error("ERROR In acceptTrustedContactInvitation", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("ACCEPT_INVITATION_FAILED"), null);
    }
  }
  //get pending trusted contact invitations of user
  static async getPendingIncommingTrustedContactInvitations(
    { userid, payload, headers },
    callback,
  ) {
    const { page = 1, limit = 10 } = payload;
    const offset = (page - 1) * limit;
    try {
      const pendingInvitations = await TrustedContacts.findAndCountAll({
        where: {
          trusted_user_id: userid,
          status: "pending",
        },
        offset: offset,
        limit: limit,
        include: [
          {
            model: User,
            as: "inviter",
            where: { is_active: true },
            attributes: ["id", "name", "phone_number", "profile_photo"],
            required: true,
          },
        ],
      });
      const data = pendingInvitations.rows.map((invitation) => {
        const invitationData = invitation.toJSON();
        const inviterProfilePhoto = invitationData.inviter?.profile_photo;
        if (inviterProfilePhoto) {
          const imagePath = path.join(process.cwd(), "uploads", "profile_images", path.basename(inviterProfilePhoto));
          if (!fs.existsSync(imagePath)) {
            invitationData.inviter.profile_photo = null; // or set to a default avatar URL if you have one
          }else{
            invitationData.inviter.profile_photo = `${process.env.BASE_URL}/uploads/profile_images/${path.basename(inviterProfilePhoto)}`;
          }
        }
        return invitationData;
      });
      return callback(null, { data: { rows: data, count: pendingInvitations.count } });
    } catch (error) {
      logger.error("ERROR In getPendingIncommingTrustedContactInvitations", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_PENDING_INVITATIONS_FAILED"), null);
    }
  }
  static async getPendingOutgoingTrustedContactInvitations(request, callback) {
    try {
      const { payload, headers, userid } = request;
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const pendingInvitations = await TrustedContacts.findAndCountAll({
        where: {
          user_id: userid,
          status: "pending",
        },
        offset: offset,
        limit: limit,
        include: [
          {
            model: User,
            as: "trusted_contact",
            where: { is_active: true },
            attributes: ["id", "name", "phone_number", "profile_photo"],
            required: true,
          },
        ],
      });
      const data = pendingInvitations.rows.map((invitation) => {
        const invitationData = invitation.toJSON();
        const trustedContactProfilePhoto = invitationData.trusted_contact?.profile_photo;
        if (trustedContactProfilePhoto) {
          const imagePath = path.join(process.cwd(), "uploads", "profile_images", path.basename(trustedContactProfilePhoto));
          if (!fs.existsSync(imagePath)) {
            invitationData.trusted_contact.profile_photo = null; // or set to a default avatar URL if you have one
          }else{
            invitationData.trusted_contact.profile_photo = `${process.env.BASE_URL}/uploads/profile_images/${path.basename(trustedContactProfilePhoto)}`;
          }
        }
        return invitationData;
      });
      return callback(null, { data: { rows: data, count: pendingInvitations.count } });
    } catch (error) {
      logger.error("ERROR In getPendingOutgoingTrustedContactInvitations", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_PENDING_OUTGOING_INVITATIONS_FAILED"), null);
    }
  }
  //get trusted contacts of user
  static async getTrustedContacts({ userid, payload, headers }, callback) {
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const trustedContacts = await TrustedContacts.findAndCountAll({
        where: {
          user_id: userid,
          status: "accepted",
        },
        offset: offset,
        limit: limit,
        include: [
          {
            model: User,
            as: "trusted_contact",
            where: { is_active: true },
            include: [
              {
                model: Devices,
                as: "devices",
                where: { is_active: true },
                required: false,
                attributes: ["id", "device_token", "device_type"],
              },
            ],
            attributes: ["id", "name", "phone_number", "profile_photo","is_online"],
            required: true,
          },
        ],
      });
      const data = trustedContacts.rows.map((contact) => {
        const contactData = contact.toJSON();
        if (contactData.trusted_contact && contactData.trusted_contact.profile_photo) {
          const userAvatafrUrl = contactData.trusted_contact.profile_photo;
          const imagePath = path.join(process.cwd(), "uploads", "profile_images", path.basename(userAvatafrUrl));
          if (!fs.existsSync(imagePath)) {
            contactData.trusted_contact.profile_photo = null; // or set to a default avatar URL if you have one
          }else{
            contactData.trusted_contact.profile_photo = `${process.env.BASE_URL}/uploads/profile_images/${path.basename(userAvatafrUrl)}`;
          }
        }
        return contactData;
      });
      return callback(null, { data: { count: trustedContacts.count, rows: data } });
    } catch (error) {
      logger.error("ERROR In getTrustedContacts", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_TRUSTED_CONTACTS_FAILED"), null);
    }
  }
  static async getTrustedContactDetailsByUserIdAndTrustedContactId({ userid, payload, headers }, callback) {
    try {
      console.log("Fetching trusted contact details for user ID:", userid, "with payload:", payload);
      const { trustedContactId } = payload;
      const trustedContact = await TrustedContacts.findOne({
        where: {
          user_id: userid,
          trusted_user_id: trustedContactId,
        }
      });
      if (!trustedContact) {
        return callback(new Error("TRUSTED_CONTACT_NOT_FOUND"), null);
      }
      return callback(null, { data: trustedContact });
    } catch (error) {
      logger.error("ERROR In getTrustedContactDetailsByUserIdAndTrustedContactId", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("GET_TRUSTED_CONTACT_DETAILS_FAILED"), null);
    }
  }

  //cancel trusted contact invitation
  static async cancelTrustedContactInvitation(
    { userid, payload, headers },
    callback,
  ) {
    try {
      const { id: invitationId } = payload;
      const invitation = await TrustedContacts.findOne({
        where: {
          id: invitationId,
        },
      });
      if (!invitation) {
        return callback(new Error("INVITATION_NOT_FOUND"), null);
      }
      if (
        invitation.user_id !== userid &&
        invitation.trusted_user_id !== userid
      ) {
        return callback(new Error("UNAUTHORIZED_ACTION"), null);
      }
      if(invitation.status !== "pending"){
        return callback(new Error("ONLY_PENDING_INVITATIONS_CAN_BE_CANCELED"), null);
      }
      invitation.status = "canceled";
      await invitation.save();
      return callback(null, { data: invitation });
    } catch (error) {
      logger.error("ERROR In cancelTrustedContactInvitation", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("CANCEL_INVITATION_FAILED"), null);
    }
  }
  //delete trusted contact invitation
  static async deleteTrustedContactInvitation(
    { userid, payload, headers },
    callback,
  ) {
    const transaction = await db.sequelize.transaction();
    try {
      const { id: invitationId } = payload;
      const invitation = await TrustedContacts.findOne(
        {
          where: {
            id: invitationId,
          },
          include: [
            {
              model: User,
              as: "inviter",
              where: { is_active: true },
              attributes: ["id", "name", "phone_number"],
              required: true,
              include: [
                {
                  model: Devices,
                  as: "devices",
                  required: false,
                  attributes: ["id", "device_token", "device_type"],
                },
              ],
            },
            {
              model: User,
              as: "trusted_contact",
              where: { is_active: true },
              attributes: ["id", "name", "phone_number"],
              include: [
                {
                  model: Devices,
                  as: "devices",
                  required: false,                  
                  attributes: ["id", "device_token", "device_type"],
                },
              ],

              required: true,
            },
          ],
        },
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );
      if (!invitation) {
        await transaction.rollback();
        return callback(new Error("INVITATION_NOT_FOUND"), null);
      }
      if (
        invitation.user_id !== userid &&
        invitation.trusted_user_id !== userid
      ) {
        await transaction.rollback(); 
        return callback(new Error("UNAUTHORIZED_ACTION"), null);
      }
      if (invitation.status === "accepted") {

        await TrustedContacts.destroy({
          where: {
            [Op.or]: [
              {
                user_id: invitation.user_id,
                trusted_user_id: invitation.trusted_user_id,
              },
              {
                user_id: invitation.trusted_user_id,
                trusted_user_id: invitation.user_id,
              },
            ],
          },
        },{
          transaction,
        });
         await transaction.commit();
           if (
             invitation?.trusted_contact &&
             invitation?.trusted_contact.devices
           ) {
             for (const device of invitation.trusted_contact.devices) {
               if (device.device_token) {
                enqueueBulk([device.device_token], {
                  title: "Trusted Contact Invitation Deleted",
                  body: `You are no longer a trusted contact of ${invitation?.inviter?.name}.`,
                  data: { invitationId: invitation.id, messageType: "DELETED_TRUSTED_CONTACT" },
                }); 
               }
             }
           }
         
        return callback(null, {
          data: invitation,

        });
      }
      
      await invitation.destroy();
      await transaction.commit();
      return callback(null, {
        data: "Successfully deleted trusted contact invitation",
      });
    } catch (error) {
        await transaction.rollback();
      logger.error("ERROR In deleteTrustedContactInvitation", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("DELETE_TRUSTED_CONTACT_FAILED"), null);
    }
  }
   
  static async countTrustedContacts({ userid, payload, headers }, callback) {
    try {
      const count = await TrustedContacts.count({
        where: {
          user_id: userid,
          status: "accepted",
        },
      });
      return callback(null, { data: count });
    } catch (error) {
      logger.error("ERROR In countTrustedContacts", { error: error });
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return callback(new Error("COUNT_TRUSTED_CONTACTS_FAILED"), null);
    }
  }

  static async   getLocationShareContactIds(userId) {
      const contacts = await TrustedContacts.findAll({
          where: {
              status: "accepted",
              // share_location: true,
              // eslint-disable-next-line import/no-named-as-default-member
              [db.Sequelize.Op.or]: [
                  { user_id: userId },
                  { trusted_user_id: userId },
              ],
          },
          attributes: ["user_id", "trusted_user_id"],
      });
      return contacts.map((c) =>
          Number(c.user_id) === Number(userId)
              ? Number(c.trusted_user_id)
              : Number(c.user_id)
      );
  }

  static async getTrustedContactDevicesTokens({ userid, payload, headers }, callback) {
    logger.info("Fetching trusted contact devices tokens for user ID:", userid);
    logger.info("Payload:", payload);
  }
}
