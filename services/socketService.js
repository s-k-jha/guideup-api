const jwt = require('jsonwebtoken');
const ChatOrder = require('../models/ChatOrder');
const ChatMessage = require('../models/ChatMessage');

// Module-level reference to the Socket.IO server instance, set by initSocket().
let io = null;

/**
 * Verifies that the connected socket is a participant (student or mentor)
 * of the given ChatOrder. Returns the loaded chatOrder on success, or null
 * if the order doesn't exist or the socket isn't authorized for it.
 */
async function authorizeChatSocket(socket, chatOrderId) {
  const chatOrder = await ChatOrder.findById(chatOrderId);
  if (!chatOrder) return null;

  if (socket.role === 'user') {
    if (chatOrder.userId.toString() !== socket.participantId) return null;
  } else if (socket.role === 'mentor') {
    if (chatOrder.mentorId?.toString() !== socket.participantId) return null;
  } else {
    return null;
  }

  return chatOrder;
}

/**
 * Initializes Socket.IO on top of the given HTTP server. Call once from server.js.
 */
const initSocket = (httpServer) => {
  const { Server } = require('socket.io');

  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== 'user' && decoded.role !== 'mentor') {
        return next(new Error('Invalid token'));
      }
      socket.role = decoded.role;
      socket.participantId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.role === 'mentor') {
      socket.join(`mentor:${socket.participantId}`);
    }

    socket.on('chat:join', async (payload, callback) => {
      try {
        const { chatOrderId } = payload || {};
        const chatOrder = await authorizeChatSocket(socket, chatOrderId);
        if (!chatOrder) {
          return callback?.({ error: 'Not authorized for this chat' });
        }
        socket.join(`chat:${chatOrderId}`);
        callback?.({ success: true });
      } catch (error) {
        callback?.({ error: 'Not authorized for this chat' });
      }
    });

    socket.on('chat:message', async (payload, callback) => {
      try {
        const { chatOrderId, text } = payload || {};
        const chatOrder = await authorizeChatSocket(socket, chatOrderId);
        if (!chatOrder) {
          return callback?.({ error: 'Not authorized for this chat' });
        }

        const trimmedText = typeof text === 'string' ? text.trim() : '';
        if (!trimmedText) {
          return callback?.({ error: 'Message cannot be empty' });
        }
        if (trimmedText.length > 2000) {
          return callback?.({ error: 'Message cannot exceed 2000 characters' });
        }

        const message = await ChatMessage.create({
          chatOrderId,
          senderRole: socket.role,
          senderId: socket.participantId,
          text: trimmedText,
        });

        const messagePlain = message.toObject();

        io.to(`chat:${chatOrderId}`).emit('chat:message', messagePlain);
        callback?.({ success: true, message: messagePlain });
      } catch (error) {
        callback?.({ error: 'Not authorized for this chat' });
      }
    });
  });

  return io;
};

/**
 * Pushes a real-time "someone connected" notification to a mentor, if they
 * currently have an open socket connection. Safe no-op before initSocket().
 */
const notifyMentorNewChat = (mentorId, payload) => {
  if (!io) return;
  io.to(`mentor:${mentorId}`).emit('chat:incoming', payload);
};

/**
 * Notifies both participants in a chat room that the chat has ended.
 * Safe no-op before initSocket().
 */
const notifyChatEnded = (chatOrderId) => {
  if (!io) return;
  io.to(`chat:${chatOrderId}`).emit('chat:ended');
};

module.exports = {
  initSocket,
  notifyMentorNewChat,
  notifyChatEnded,
};
