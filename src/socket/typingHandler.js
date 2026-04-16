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
    try {
    console.log('Received typing:start event with payload:', payload);
    
    const {  roomId } = JSON.parse(payload);
    const typingData = {
      userId: socket.userId,
      userName: socket.userName,
      roomId,
    };
    io.to(`${roomId}`).emit('typing:start', { ...typingData, chatWith: socket.userId });
    } catch (err) {
      console.error('[Socket] typing:start error', err);
    }
  });

  socket.on('typing:stop', (payload) => {
    try {
    const {  roomId } = JSON.parse(payload);
    const typingData = {
      userId: socket.userId,
      userName: socket.userName,
      roomId,
    };
    io.to(`${roomId}`).emit('typing:stop', { ...typingData, chatWith: socket.userId });
    } catch (err) {
      console.error('[Socket] typing:stop error', err);
    }
  });
};
