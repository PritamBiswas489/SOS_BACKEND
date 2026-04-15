import moment from "moment";
import { promisify } from "../libraries/utility.js";

export const registerLocationHandlers = (io, socket) => {
    // Handler for receiving location updates from the client
    socket.on('location:update', async (locationData, ack) => {
         try{
                const payload = JSON.parse(locationData);
                let locObject = payload?.loc || null;
                const roomId = payload?.roomId || null;
                if(!locObject?.latitude){
                         //Choose Random location from predefined list if latitude is missing
                         const { locations } = await import("../libraries/locations.js");
                         const randomIndex = Math.floor(Math.random() * locations.length);
                         locObject = locations[randomIndex];
                }
                console.log("====================== LOCATION UPDATE ===============================================")
                console.log(`Received location update for room ${roomId}:`, locObject);
         }catch(err){
             console.error("Error handling location:update:", err);
         }
    });
}