import { getConnectedUsers } from "./index.js";
/**
 * Presence / Online-status handler.
 *
 * Events:
 *  - presence:subscribe   — client wants to know who's online from a contact list
 *  - presence:ping        — heartbeat to keep presence alive
 */
export const registerPresenceHandlers = (io, socket) => {
  /**
   * Payload: { userIds: string[] }
   * Returns the online status for each requested user.
   */
//   {
//     "userIds": ["22","23"]
// }
  socket.on("presence:subscribe", (payload, ack) => {
    const { userIds } = JSON.parse(payload);
    if (!Array.isArray(userIds)) return;
    const connectedUsers = getConnectedUsers();
    console.log("Connected users map:", connectedUsers);
     
    const statuses = userIds.map((id) => ({
      userId: id,
      online: connectedUsers.has(id),
    }));

    if (typeof ack === "function") {
      ack?.(statuses);
    }
  });
  /**
   * Heartbeat — keeps the user's session active.
   */
  socket.on("presence:ping", (_, ack) => {
    if (typeof ack === "function") {
      ack?.({ ts: Date.now() });
    }
  });
};
