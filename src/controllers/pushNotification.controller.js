import db from "../databases/models/index.js";
import "../config/environment.js";
import PushNotificationService from "../services/pushNotification.service.js";

export default class PushNotificationController {
    static async testSendPushNotification({ payload, headers }) {
       
        return new Promise(async (resolve, reject) => {
             PushNotificationService.sendNotificationByFcmToken(payload, (err, response) => {
                if (err) {
                    return reject({
                        status: 500,
                        data: null,
                        message: headers?.i18n.__("PUSH_NOTIFICATION_TEST_FAILED"),
                        error: err.message,
                    });
                }
                return resolve({
                    status: 200,
                    data: response.data,
                    message: headers?.i18n.__("PUSH_NOTIFICATION_TEST_SUCCESSFUL"),
                    error: null,
                });
            });
        });
        
    }


}