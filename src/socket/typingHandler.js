/**
 * Typing Indicator handler.
 *
 * Events:
 *  - typing:start   — user started typing
 *  - typing:stop    — user stopped typing
 *
 * For 1-on-1 chats, payload: { recipientId }
 * For group chats, payload:  { groupId }
 *
 * Debounce is handled on the client side (recommended: 1-2s).
 */
export const registerTypingHandlers = (io, socket) => {
  socket.on('typing:start', (payload) => {
    console.log('Received typing:start event with payload:', payload);
    
    const { recipientId, roomId } = JSON.parse(payload);
    const typingData = {
      userId: socket.userId,
      userName: socket.userName,
    };
    io.to(`${roomId}`).emit('typing:start', { ...typingData, chatWith: socket.userId });
  });

  socket.on('typing:stop', (payload) => {
    const { recipientId, roomId } = JSON.parse(payload);
    const typingData = {
      userId: socket.userId,
      userName: socket.userName,
    };
    io.to(`${roomId}`).emit('typing:stop', { ...typingData, chatWith: socket.userId });
  });
};
