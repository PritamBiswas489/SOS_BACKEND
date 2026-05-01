import moment from "moment";
import { promisify } from "../libraries/utility.js";
import db from "../databases/models/index.js";
import TrustedContactService from "../services/trustedContact.service.js";

export const registerHealthHandler = (io, socket) => {

    socket.on('contact:healthdata:update', async (data, ack) => {
        let healthData = data;
        if( typeof data !== 'object') {
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
    });


}