import ChatService from "../services/chat.service.js";
export const registerStatusHandlers = (io, socket) => {
  // Handler for message delivery status updates
  socket.on("message:delivered", async (payload) => {
    console.log("[Status] Received message:delivered for payload:", payload);
    const { messageId, senderId } = JSON.parse(payload);
    if (!messageId || !senderId) return;
    const message = await ChatService.getMessageDetails(messageId);

    if (!message) {
      console.warn(`[Status] Message with ID ${messageId} not found in DB`);
      return;
    }
    try {
      console.log(`[Status] Message details for ID ${messageId}:`, message);
      // Update message status in DB (only escalate, never downgrade)
      await ChatService.updateMessageStatus(messageId, "delivered");
      // Create/update receipt
      await ChatService.saveMessageReceipt({
        messageId,
        userId: socket.userId,
        status: "delivered",
      });
    } catch (err) {
      console.error("[Status] message:delivered DB error", err);
    }
    io.to(message.room_id).emit("message:status", {
      messageId,
      status: "delivered",
      updatedBy: socket.userId,
      timestamp: new Date().toISOString(),
    });
  });
  // Similar handler for "message:read" event
  socket.on("message:read", async (payload) => {
    console.log("[Status] Received message:read for payload:", payload);
    const { messageId, senderId } = JSON.parse(payload);
    if (!messageId || !senderId) return;
    const message = await ChatService.getMessageDetails(messageId);

    if (!message) {
      console.warn(`[Status] Message with ID ${messageId} not found in DB`);
      return;
    }
    try {
      console.log(`[Status] Message details for ID ${messageId}:`, message);
      // Update message status in DB (only escalate, never downgrade)
      await ChatService.updateMessageStatus(messageId, "read");
      // Create/update receipt
      await ChatService.saveMessageReceipt({
        messageId,
        userId: socket.userId,
        status: "read",
      });
    } catch (err) {
      console.error("[Status] message:read DB error", err);
    }
    io.to(message.room_id).emit("message:status", {
      messageId,
      status: "read",
      updatedBy: socket.userId,
      timestamp: new Date().toISOString(),
    });
  });
};
