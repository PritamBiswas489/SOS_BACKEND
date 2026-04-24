import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import TrustedContactService from "./trustedContact.service.js";
import { getProfileImage, promisify } from "../libraries/utility.js";
import { enqueueBulk } from "../queues/notificationQueue.js";
import { response } from "express";
const { Op, fn, col, User, SosSessions, SosSessionNotifications, Devices, SosSessionAudioRecords } = db;
import { audioFileLink } from "../libraries/utility.js";
export default class SosSessionsService {
  static async registerSosSession({ userid, payload, headers }, callback) {
    try {
      //check if there is already an active sos session for the user today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const activeSession = await SosSessions.findOne({
        where: {
          user_id: userid,
          status: "active",
          created_at: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
      });
      let newSosSession = null;
      if (activeSession) {
        const number_of_trigger = activeSession.number_of_trigger + 1;
        await activeSession.update({ number_of_trigger });
        const updatedSession = await activeSession.reload();
        newSosSession = updatedSession;
      } else {
        newSosSession = await SosSessions.create({
          user_id: userid,
          number_of_trigger: 1,
        });
      }
      if (newSosSession?.id) {
        this.sendSosSessionNotificationProcess(newSosSession.id).catch((e) => {
          process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
          logger.error("ERROR In sendSosSessionNotificationProcess", { error: e });
        });
      }
      return callback(null, { data: newSosSession });
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In registerSosSession", { error: e });
      console.error("Error creating SOS session:", e.message);
      return callback(new Error("REGISTER_SOS_SESSION_FAILED"), null);
    }
  }
  static async sendSosSessionNotification(
    { payload, headers, user },
    callback,
  ) {
    try {
      // Implement the logic to send SOS session notification
      const session_id = payload.session_id;
      const sosSession = await SosSessions.findOne({
        where: { id: session_id },
      });
      if (!sosSession) {
        return callback(new Error("SOS_SESSION_NOT_FOUND"), null);
      }
       await this.sendSosSessionNotificationProcess(
        sosSession.id,
      );
      const notifications = await SosSessionNotifications.findAll({
        where: {
         sos_session_id: session_id,
        },
      });
    
      return callback(null, { data: notifications });
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In sendSosSessionNotification", { error: e });
      console.error("Error sending SOS session notification:", e.message);
      return callback(new Error("SEND_SOS_SESSION_NOTIFICATION_FAILED"), null);
    }
  }
  static async sendSosSessionNotificationProcess(sosSessionId) {
    try {
    const sosSession = await SosSessions.findOne({
      where: {
        id: sosSessionId,
      },
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });
    console.log("sosSession", sosSession);
   let victimName = sosSession?.user?.name;
    const getTrustedContacts = await promisify(
      TrustedContactService.chatContactFriendList.bind(TrustedContactService),
      { userid: sosSession.user_id },
    );
    const trustedContacts = getTrustedContacts?.data || [];
    const session_id = sosSession.id;
    const receivers = {};
    if (trustedContacts.length > 0) {
      for (const contact of trustedContacts) {
        if (contact?.inviter?.id === sosSession.user_id) {
          receivers[contact?.trusted_contact?.id] =
            contact?.trusted_contact?.devices || [];
        } else if (contact?.trusted_contact?.id === sosSession.user_id) {
          receivers[contact?.inviter?.id] = contact?.inviter?.devices || [];
        }
      }
    }
    if (Object.keys(receivers).length > 0) {
      for (const receiverId in receivers) {
        const devices = receivers[receiverId];
        const checkExistingNotification = await SosSessionNotifications.findOne({
          where: {
            sos_session_id: session_id,
            to_user_id: receiverId,
          },
        });
        const numberOfAlerts = checkExistingNotification ? checkExistingNotification.alert_number + 1 : 1;
        if (!checkExistingNotification) {
          await SosSessionNotifications.create({
            sos_session_id: session_id,
            to_user_id: receiverId,
            status: "pending",
            alert_number: numberOfAlerts,
          });    
        }else{
          const alert_number = checkExistingNotification.alert_number + 1;
          await checkExistingNotification.update({ alert_number });
        }
        if(devices && devices.length > 0){
          let notificationTitle, notificationBody;
          if (numberOfAlerts === 1) {
            notificationTitle = `SOS Alert: ${victimName} needs help!`;
            notificationBody = `${victimName} has triggered an SOS alert. Please check the app and offer your assistance if possible.`;
          } else if (numberOfAlerts === 2) {
            notificationTitle = `⚠️ Urgent SOS: ${victimName} still needs help!`;
            notificationBody = `${victimName} has triggered a second SOS alert. Please respond immediately.`;
          } else {
            notificationTitle = `🚨 CRITICAL SOS #${numberOfAlerts}: ${victimName} is in danger!`;
            notificationBody = `${victimName} has triggered ${numberOfAlerts} SOS alerts. This is a critical emergency — please respond now!`;
          }
          const deviceTokens = devices.map((device) => device.device_token);
          enqueueBulk(deviceTokens, {
            title: notificationTitle,
            body: notificationBody,
            data: {
              messageType:'SOS',
              fetchSOS:'1'
            }
          });
        }
      }
    }
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In sendSosSessionNotificationProcess", { error: e });
      console.error("Error in SOS notification process:", e.message);
      throw e;
    }
  }
  //This method will handle incoming notifications related to SOS sessions, such as updates on the session status or responses from emergency contacts.
  static async incommingSosSessionNotification({ payload, headers, user },callback) {
    try{
      
      const userId = user?.id;
      const limit = parseInt(payload.limit) || 10;
      const page = parseInt(payload.page) || 1;
      const statusFilter = payload?.status; // e.g., "active", "pending", "resolved"
      const offset = (page - 1) * limit;

     const response = await SosSessionNotifications.findAndCountAll({
        distinct: true,
        where: {
          to_user_id: userId
        },
        order: [["created_at", "DESC"]],
        include: [
          {
            model: SosSessions,
            as: "sos_session",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "phone_number","profile_photo"],
              },
              {
                model: SosSessionAudioRecords,
                as: "audio_records",
                attributes: ["id", "file_name", "created_at"],
              },
              
            ],
            where: statusFilter ? { status: statusFilter } : {}, // Apply status filter if provided
            required: true,
          },
        ],
        limit,
        offset,
      });
      const count = response.count || 0;
      const notifications = response.rows.length > 0 ? response.rows.map((notification) => {
        const plain = notification.toJSON();
        const photo = plain?.sos_session?.user?.profile_photo
          ? `${process.env.IMAGE_BASE_URL}${plain.sos_session.user.profile_photo}`
          : null;
        if (photo) {
          plain.sos_session.user.profile_photo = getProfileImage(photo);
        }
        if(plain.sos_session.audio_records && plain.sos_session.audio_records.length > 0){
          const audioRecords = [];
          plain.sos_session.audio_records.forEach((audioRecord) => {
            audioRecord.file_url = audioFileLink(audioRecord.file_name);
            audioRecords.push(audioRecord);
          });
          plain.sos_session.audio_records = audioRecords;
        }
        return plain;
      }) : [];

     return callback(null, {
        data: {
          notifications: notifications,
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
        },
      });
    }catch(e){
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In incommingSosSessionNotification", { error: e });
      console.error("Error handling incoming SOS session notification:", e.message);
      return callback(new Error("INCOMMING_SOS_SESSION_NOTIFICATION_FAILED"), null);
    }

  }
  // This method will allow users to view their SOS session history, including details of each session and the status of notifications sent to their trusted contacts.
  static async mySosSessions({ payload, headers, user }, callback) {
    try {
      const userId = user?.id;
      const limit = parseInt(payload.limit) || 10;
      const page = parseInt(payload.page) || 1;
      const statusFilter = payload?.status;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: userId };
      if (statusFilter) {
        whereClause.status = statusFilter;
      }

      const response = await SosSessions.findAndCountAll({
        distinct: true,
        where: whereClause,
        order: [["created_at", "DESC"]],
        include: [
          {
            model: SosSessionNotifications,
            as: "notifications",
            include: [
              {
                model: User,
                as: "to_user",
                attributes: ["id", "name", "phone_number","profile_photo"],
              },
            ],
          },
          {
            model:SosSessionAudioRecords,
            as:"audio_records",
            attributes:["id", "file_name", "created_at"],
          }
        ],
        limit,
        offset,
      });

      const count = response.count || 0;

      const sessions = response.rows.length > 0 ? response.rows.map((session) => {
        const plain = session.toJSON();
        let numberofResponded = 0;
        let numberOnTheWay = 0;
        let numberReached = 0;
        let numberFailed = 0;
        let numberDeclined = 0;
        let numberPending = 0;
        const audioRecords = [];
        
        if(plain.audio_records && plain.audio_records.length > 0){
          plain.audio_records.forEach((audioRecord) => {
            audioRecord.file_url = audioFileLink(audioRecord.file_name);
            audioRecords.push(audioRecord);
          });
        }
        plain.audio_records = audioRecords;
        const notifications = plain.notifications.map((notification) => {
          const photo = notification?.to_user?.profile_photo
            ? `${process.env.IMAGE_BASE_URL}${notification.to_user.profile_photo}`
            : null;
          if (photo) {
            notification.to_user.profile_photo = getProfileImage(photo);
          }
          if(notification.response_status !== "pending"){
            numberofResponded++;
          }
          if(notification.response_status === "on_the_way"){
            numberOnTheWay++;
          }
          if(notification.response_status === "reached"){
            numberReached++;
          }
          if(notification.response_status === "failed"){
            numberFailed++;
          }
          if(notification.response_status === "declined"){
            numberDeclined++;
          }
          if(notification.response_status === "pending"){
            numberPending++;
          }
          return notification;
        });
        plain.numberofResponded = numberofResponded;
        plain.numberOnTheWay = numberOnTheWay;
        plain.numberReached = numberReached;
        plain.numberFailed = numberFailed;
        plain.numberDeclined = numberDeclined;
        plain.numberPending = numberPending;
        plain.notifications = notifications;
        return plain;
      }) : [];

      return callback(null, {
        data: {
          sessions,
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In mySosSessions", { error: e });
      console.error("Error fetching SOS sessions:", e.message);
      return callback(new Error("MY_SOS_SESSIONS_FAILED"), null);
    }
  }
  static async responseSosSessionNotification({ payload, headers, user }, callback) {
      try{
        const notificationId = payload.notification_id;
        let responseStatus = payload.status; // e.g., "accepted", "on_the_way", "declined"
       

        const notification = await SosSessionNotifications.findOne({
          where: {
            id: notificationId,
            to_user_id: user.id,
          },
        });
        if (!notification) {
          return callback(new Error("SOS_SESSION_NOTIFICATION_NOT_FOUND"), null);
        }
        await notification.update({ response_status: responseStatus });

        const sosNotification = await SosSessionNotifications.findOne({
          where: {
            id: notification.id,
          },
          include: [
            {
              model: User,
              as: "to_user",
              attributes: ["id", "name", "phone_number","profile_photo"],
            },
            {
              model: SosSessions,
              as: "sos_session",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "name", "phone_number","profile_photo"],
                  include:[
                    {
                      model: Devices,
                      as: "devices",
                      attributes: ["id", "device_token", "device_type"],
                    }
                  ]
                },
              ],
            },
          ],
        });
        //send push notification to the session owner about the response from the trusted contact
        const deviceTokens = sosNotification?.sos_session?.user?.devices?.map((device) => device.device_token) || [];
        if(deviceTokens.length > 0){
          let notificationTitle, notificationBody;
          const responderName = sosNotification?.to_user?.name || "A trusted contact";
          if (responseStatus === "accepted") {
            notificationTitle = `✅ Good news: ${responderName} accepted your SOS alert!`;
            notificationBody = `${responderName} has accepted your SOS alert and is on their way to help you. Please stay safe and wait for their arrival.`;
          }
          if (responseStatus === "declined") {
            notificationTitle = `⚠️ Update: ${responderName} declined your SOS alert`;
            notificationBody = `${responderName} has declined your SOS alert. Please try reaching out to other trusted contacts or call emergency services if you need immediate assistance.`;
          }
          if(responseStatus === "on_the_way"){
            notificationTitle = `🚗 Update: ${responderName} is on the way!`;
            notificationBody = `${responderName} is on the way to help you. Please stay safe and wait for their arrival.`;
          }
            if(responseStatus === "failed"){
            notificationTitle = `❌ Update: ${responderName} was unable to help`;
            notificationBody = `${responderName} was unable to reach you. Please try contacting other trusted contacts or call emergency services if you need immediate assistance.`;
            }
            if(responseStatus === "reached"){
              notificationTitle = `✅ Update: ${responderName} has reached you!`;
              notificationBody = `${responderName} has reached your location. Please stay safe and follow their instructions.`;
            }
            enqueueBulk(deviceTokens, {
            title: notificationTitle,
            body: notificationBody,
            data: {
              messageType: 'VICTIM',
              fetchVictimSOS: '1',
            }
            });

          }
        
         return callback(null, { data: sosNotification });

      }catch(e){
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
        logger.error("ERROR In responseSosSessionNotification", { error: e });
        console.error("Error responding to SOS session notification:", e.message);
        return callback(new Error("RESPONSE_SOS_SESSION_NOTIFICATION_FAILED"), null);
      }
  }
  static async changeMySosSessionStatus({ payload, headers, user }, callback) {
    try{
      const sessionId = payload.session_id;
      const newStatus = payload.status;
      const sosSession = await SosSessions.findOne({
        where: {
          id: sessionId,
          user_id: user.id,
        },
      });
      if(!sosSession){
        return callback(new Error("SOS_SESSION_NOT_FOUND"), null);
      }
     await sosSession.update({ status: newStatus });

     const session = await sosSession.reload({
        include:[
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "phone_number","profile_photo"],
          },
          {
            model: SosSessionNotifications,
            as: "notifications",
            include:[
              {
                model: User,
                as: "to_user",
                attributes: ["id", "name", "phone_number","profile_photo"],
                include:[
                  {
                    model: Devices,
                    as: "devices",
                    attributes: ["id", "device_token", "device_type"],
                  }
                ]
              }
            ]
          }
        ]
      });
      //send notification to trusted contacts about the status change
      const deviceTokens = [];
      if(session.notifications && session.notifications.length > 0){
      session.notifications.forEach((notification) => {
        const toUserDevices = notification?.to_user?.devices || [];
        toUserDevices.forEach((device) => {
          deviceTokens.push(device.device_token);
        });
      });
     }
      let notificationTitle, notificationBody;
      if(deviceTokens.length > 0){
        if (newStatus === "cancelled") {
          notificationTitle = `❌ SOS Alert Cancelled`;
          notificationBody = `${session?.user?.name} has cancelled the SOS alert. Thank you for being ready to help.`;
        }
        if (newStatus === "resolved") {
          notificationTitle = `✅ SOS Alert Resolved`;
          notificationBody = `${session?.user?.name} has marked the SOS alert as resolved. Thank you for your support.`;
        }
        enqueueBulk(deviceTokens, {
          title: notificationTitle,
          body: notificationBody,
          data: {
            fetchSOS:'1'
          }
        });
      }
      return callback(null, { data: session });
    }catch(e){
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In changeMySosSessionStatus", { error: e });
      console.error("Error changing SOS session status:", e.message);
      return callback(new Error("CHANGE_SOS_SESSION_STATUS_FAILED"), null);
    }

  }
  static async saveSessionAudioFileName({ session_id, file_name }, callback) {
     try{
      const sessionId = session_id;
      const audioFileName = file_name;
      await SosSessionAudioRecords.create({
        sos_session_id: sessionId,
        file_name: audioFileName,
      });
      return callback(null, { data: { message: "Audio file name saved successfully" } });

     }catch(e){
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In saveSessionAudioFileName", { error: e });
      console.error("Error saving session audio file name:", e.message);
      return callback(new Error("SAVE_SESSION_AUDIO_FILE_NAME_FAILED"), null);
     }
  }
}
