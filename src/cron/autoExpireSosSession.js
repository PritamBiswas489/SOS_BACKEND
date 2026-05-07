import { Op } from "sequelize";
import db from "../databases/models/index.js";
const { SosSessions, User, Devices } = db;
import { enqueueBulk } from "../queues/notificationQueue.js";
export async function sendAutoExpireWarningNotification() {
  try {
    console.log("Sending auto-expire warning notification to users........");
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessions = await SosSessions.findAll({
      where: {
        created_at: {
          [Op.lte]: twentyFourHoursAgo,
        },
        before_expire_notification: false,
        status: "active",
      },
      limit: 10, // Process in batches of 10
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Devices,
              as: "devices",
              attributes: ["id", "device_token", "device_type"],
            },
          ],
        },
      ],
    });

    console.log(`Found ${sessions.length} sessions that are about to expire.`);
    let deviceTokensToNotify = [];
    let sessionIdsToUpdate = [];
    for (const session of sessions) {
      console.log("Processing session ID:", session.id);
      console.log(JSON.stringify(session, null, 2));
      const user = session.user;
      if (user && user.devices && user.devices.length > 0) {
        console.log(
          `Sending notification to user ID: ${user.id}, email: ${user.email}`,
        );
        const deviceTokens = user.devices.map((device) => device.device_token);
        deviceTokensToNotify.push(...deviceTokens);
      }
      sessionIdsToUpdate.push(session.id);
    }
    if (deviceTokensToNotify.length > 0) {
      console.log("device tokens to notify:", deviceTokensToNotify);
      //unique tokens
      deviceTokensToNotify = [...new Set(deviceTokensToNotify)];
      const notificationTitle = "⏰ SOS Session Expiring Soon";
      const notificationMessage =
        "Your SOS session is about to expire in 2 hour. Please take necessary action.";

      enqueueBulk(deviceTokensToNotify, {
        title: notificationTitle,
        body: notificationMessage,
        data: {},
      });
    }
    if (sessionIdsToUpdate.length > 0) {
      console.log(
        "Updating sessions to mark notification sent:",
        sessionIdsToUpdate,
      );
      await SosSessions.update(
        { before_expire_notification: true },
        { where: { id: sessionIdsToUpdate } },
      );
    }
  } catch (error) {
    console.error("Error in sendAutoExpireWarningNotification:", error);
  }
}
//expired
export async function autoExpireSosSessionAndSendNotification() {
  console.log("Running auto-expire SOS session task.......");
  try{
    const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000);
    const sessions = await SosSessions.findAll({
      where: {
        created_at: {
            [Op.lte]: twentySixHoursAgo,
        },
        status: "active",
        before_expire_notification: true, // Only target sessions that were notified
      },
      limit : 10, // Process in batches of 10
      include: [
        {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
            include: [
                {
                    model: Devices,
                    as: "devices",
                    attributes: ["id", "device_token", "device_type"],
                },
            ],
        },
      ],
    });
    let deviceTokensToNotify = [];
    let sessionIdsToExpire = [];
    for (const session of sessions) {
      const user = session.user;
        if (user && user.devices && user.devices.length > 0) {
            const deviceTokens = user.devices.map((device) => device.device_token);
            deviceTokensToNotify.push(...deviceTokens);
        }
        sessionIdsToExpire.push(session.id);
    }
    if (deviceTokensToNotify.length > 0) {
        deviceTokensToNotify = [...new Set(deviceTokensToNotify)];
        const notificationTitle = "❌ SOS Session Expired";
        const notificationMessage =
          "Your SOS session has expired. Please trigger a new session if you still need help.";
        enqueueBulk(deviceTokensToNotify, {
          title: notificationTitle,
          body: notificationMessage,
            data: {},
        });
    }
    if (sessionIdsToExpire.length > 0) {
        console.log(
            "Updating sessions to mark as expired:",
            sessionIdsToExpire,
        );
        await SosSessions.update(
            { status: "expired" },
            { where: { id: sessionIdsToExpire } },
        );
    }
  }catch(error){
    console.error("Error in autoExpireSosSession:", error);
  }

}

autoExpireSosSessionAndSendNotification();
