import "../config/environment.js";
import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
import logger from "../config/winston.js";
import TrustedContactService from "./trustedContact.service.js";
import { getProfileImage, promisify } from "../libraries/utility.js";
import { enqueueBulk } from "../queues/notificationQueue.js";
const { Op, fn, col, User, SosSessions, SosSessionNotifications } = db;
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
              type:'emergency'
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
        ],
        limit,
        offset,
      });

      const count = response.count || 0;

      const sessions = response.rows.length > 0 ? response.rows.map((session) => {
        const plain = session.toJSON();
        const numberofResponded = 0;
        const numberOnTheWay = 0;
        const notifications = plain.notifications.map((notification) => {
          const photo = notification?.to_user?.profile_photo
            ? `${process.env.IMAGE_BASE_URL}${notification.to_user.profile_photo}`
            : null;
          if (photo) {
            notification.to_user.profile_photo = getProfileImage(photo);
          }
          if(notification.response_status === "responded"){
            numberofResponded++;
          }
          if(notification.response_status === "on_the_way"){
            numberOnTheWay++;
          }
          return notification;
        });
        plain.numberofResponded = numberofResponded;
        plain.numberOnTheWay = numberOnTheWay;
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
}
