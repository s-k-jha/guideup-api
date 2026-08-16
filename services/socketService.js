const jwt = require('jsonwebtoken');
const ChatOrder = require('../models/ChatOrder');
const ChatMessage = require('../models/ChatMessage');
const Mentor = require('../models/Mentor');
const llmService = require('./llmService');

// Module-level reference to the Socket.IO server instance, set by initSocket().
let io = null;

// In-memory per-chat-order presence + timer bookkeeping, keyed by chatOrderId
// string. The 2-minute window is server-authoritative: it's only armed once
// BOTH participants have an open socket in the room, so neither side can
// burn down the clock waiting alone, and it can't be skipped by disconnecting.
const roomPresence = new Map();

function getPresence(chatOrderId) {
  let presence = roomPresence.get(chatOrderId);
  if (!presence) {
    presence = { user: new Set(), mentor: new Set(), endsAt: null, timer: null, started: false };
    roomPresence.set(chatOrderId, presence);
  }
  return presence;
}

function clearPresence(chatOrderId) {
  const presence = roomPresence.get(chatOrderId);
  if (presence?.timer) clearTimeout(presence.timer);
  roomPresence.delete(chatOrderId);
}

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
 * Marks a chat order completed — used both by the mentor's manual "End Chat"
 * action and by the server-side timeout when the 2-minute window elapses.
 * Idempotent: a no-op if the order is already completed.
 */
const completeChatOrder = async (chatOrderId) => {
  const chatOrder = await ChatOrder.findById(chatOrderId);
  if (!chatOrder || chatOrder.status === 'completed') return chatOrder;

  chatOrder.status = 'completed';
  await chatOrder.save();

  const mentor = await Mentor.findById(chatOrder.mentorId);
  if (mentor && mentor.activeChatOrderId && mentor.activeChatOrderId.toString() === chatOrderId.toString()) {
    mentor.availabilityStatus = 1;
    mentor.activeChatOrderId = null;
    await mentor.save();
  }

  clearPresence(chatOrderId.toString());
  notifyChatEnded(chatOrderId.toString());
  return chatOrder;
};

/**
 * Roughly how long a person would take to type `text` in a chat, so the AI's
 * reply doesn't land instantly (which reads as obviously automated). Not a
 * disclosure mechanism either way — the AI badge/banner already handles
 * that — purely pacing, the same idea as a "typing…" indicator in any chat
 * app. Clamped so it never meaningfully eats into the 2-minute session.
 */
function estimateTypingDelayMs(text) {
  const READING_PAUSE_MS = 400;
  const MS_PER_CHAR = 20;
  const MIN_DELAY_MS = 1200;
  const MAX_DELAY_MS = 6000;
  const base = READING_PAUSE_MS + text.length * MS_PER_CHAR;
  const jittered = base * (0.85 + Math.random() * 0.3); // ±15%
  return Math.max(MIN_DELAY_MS, Math.min(MAX_DELAY_MS, Math.round(jittered)));
}

/**
 * Generates and posts an AI reply for an `aiHandled` chat order, after the
 * student's message has already been persisted and broadcast. Never throws
 * out of the caller — on any failure it posts a short graceful fallback
 * message instead, so the student is never left in silence. An in-flight
 * guard (`presence.aiReplying`) prevents overlapping replies if the student
 * fires several messages before the first one lands.
 */
async function triggerAiReply(chatOrderId, chatOrder) {
  const presence = roomPresence.get(chatOrderId);
  if (presence?.aiReplying) return;
  if (presence) presence.aiReplying = true;

  try {
    const [mentor, history] = await Promise.all([
      Mentor.findById(chatOrder.mentorId),
      ChatMessage.find({ chatOrderId }).sort({ createdAt: 1 }).limit(30),
    ]);

    const replyText = await llmService.generateMentorReply({
      mentor,
      history,
      studentMessage: history[history.length - 1]?.text || '',
    });

    // Human-paced delivery — see estimateTypingDelayMs.
    await new Promise((resolve) => setTimeout(resolve, estimateTypingDelayMs(replyText)));

    // The order may have completed (timer ran out) while the LLM call/delay
    // was in flight — don't post a reply into a chat that already ended.
    const freshOrder = await ChatOrder.findById(chatOrderId).select('status');
    if (!freshOrder || freshOrder.status === 'completed') return;

    const aiMessage = await ChatMessage.create({
      chatOrderId,
      senderRole: 'mentor',
      senderId: chatOrder.mentorId,
      text: replyText,
      senderIsAi: true,
    });
    io.to(`chat:${chatOrderId}`).emit('chat:message', aiMessage.toObject());
  } catch (error) {
    try {
      const freshOrder = await ChatOrder.findById(chatOrderId).select('status');
      if (freshOrder && freshOrder.status !== 'completed') {
        const fallback = await ChatMessage.create({
          chatOrderId,
          senderRole: 'mentor',
          senderId: chatOrder.mentorId,
          text: "Sorry, I'm having trouble responding right now. Please try rephrasing your question.",
          senderIsAi: true,
        });
        io.to(`chat:${chatOrderId}`).emit('chat:message', fallback.toObject());
      }
    } catch (_) {
      // Swallow — never let a fallback-posting failure crash the socket handler.
    }
  } finally {
    if (presence) presence.aiReplying = false;
  }
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
        socket.chatOrderId = chatOrderId;

        if (chatOrder.status === 'completed') {
          return callback?.({ success: true, ended: true });
        }

        const presence = getPresence(chatOrderId);
        presence[socket.role].add(socket.id);

        const otherRole = socket.role === 'user' ? 'mentor' : 'user';
        const otherPresent = presence[otherRole].size > 0;
        // AI-handled orders have no human mentor socket that will ever join
        // this room — the student's own join is sufficient to start. For
        // every existing/non-AI order `chatOrder.aiHandled` is false (schema
        // default), so this collapses to exactly the original `otherPresent`
        // check — zero behavior change on the human-mentor path.
        const shouldStart = chatOrder.aiHandled ? socket.role === 'user' : otherPresent;

        if (shouldStart && !presence.started) {
          presence.started = true;
          const durationMs = (chatOrder.durationMinutes || 2) * 60 * 1000;
          presence.endsAt = Date.now() + durationMs;
          presence.timer = setTimeout(() => {
            completeChatOrder(chatOrderId).catch(() => {});
          }, durationMs);

          if (!chatOrder.aiHandled) {
            // Tell whichever participant was already waiting that their
            // partner just joined and the clock has started now — excludes
            // the socket that triggered this (they get endsAt via their ack).
            socket.to(`chat:${chatOrderId}`).emit('chat:partnerJoined', {
              role: socket.role,
              endsAt: presence.endsAt,
            });
          }
        }

        callback?.({ success: true, endsAt: presence.endsAt });
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
        if (chatOrder.status === 'completed') {
          return callback?.({ error: 'This chat has ended' });
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

        if (chatOrder.aiHandled && socket.role === 'user') {
          triggerAiReply(chatOrderId, chatOrder).catch(() => {});
        }
      } catch (error) {
        callback?.({ error: 'Not authorized for this chat' });
      }
    });

    socket.on('disconnect', () => {
      const { chatOrderId, role } = socket;
      if (!chatOrderId || !role) return;
      const presence = roomPresence.get(chatOrderId);
      if (!presence) return;
      presence[role].delete(socket.id);
      // Only clean up rooms that never actually started — a started chat's
      // timer must keep running (and its endsAt must stay valid) even if a
      // participant's tab briefly disconnects and reconnects.
      if (!presence.started && presence.user.size === 0 && presence.mentor.size === 0) {
        clearPresence(chatOrderId);
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
  completeChatOrder,
};
