/**
 * Provider-agnostic AI-mentor reply generator, used by services/socketService.js
 * when a chat order's `aiHandled` flag is set. Picks whichever provider is
 * configured (Anthropic and/or OpenAI), or a deterministic mock provider for
 * local testing without any real API key.
 *
 * Callers (socketService) own what happens on failure — this module always
 * throws rather than inventing a fallback reply.
 */

const resolveProvider = () => {
  const forced = process.env.AI_PROVIDER;
  if (forced === 'mock') return 'mock';
  if (forced === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (forced === 'openai' && process.env.OPENAI_API_KEY) return 'openai';

  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
};

const isConfigured = () => resolveProvider() !== null;
const getActiveProvider = () => resolveProvider();

/**
 * Required properties of the system prompt (see plan doc for the full
 * rationale) — grounded in the mentor's own profile, kept chat-short,
 * scoped to career/mentorship topics, and — non-negotiable — honest if
 * directly asked whether this is a human or an AI. This is the content-level
 * backstop to the UI-level "AI" badge/banner the frontend always shows for
 * these chats; together they mean a student can't come away believing
 * they talked to the human mentor, whether or not they ever asked.
 */
const buildSystemPrompt = (mentor) => {
  const persona = [
    `You are an AI mentor assistant standing in for ${mentor.name || 'this mentor'}`,
    mentor.role || mentor.company ? `, a ${[mentor.role, mentor.company].filter(Boolean).join(' at ')}` : '',
    mentor.experienceYears ? ` with ${mentor.experienceYears}+ years of experience` : '',
    '.',
  ].join('');

  const domains = (mentor.domains || []).concat(mentor.skills || []).filter(Boolean);
  const domainsLine = domains.length ? `Their areas of expertise: ${domains.join(', ')}.` : '';
  const bioLine = mentor.bio ? `Background: ${mentor.bio}` : '';

  return [
    persona,
    domainsLine,
    bioLine,
    '',
    "You're in a rapid, ~2-minute live chat with a student on GuideUp, a mock-interview and career-mentorship platform.",
    'Keep replies short and conversational — a few sentences, not an essay. No headers, no bullet-heavy formatting.',
    "Stay focused on career advice, interview prep, resumes, and this mentor's areas of expertise. If asked something wildly off-topic, redirect politely without being preachy about it.",
    "Don't invent specific facts about the mentor that aren't given above — no fabricated projects, anecdotes, or credentials. General, domain-consistent advice is fine.",
    'If the student directly asks whether you are human or an AI, answer honestly — you are an AI assistant grounded in this mentor\'s profile, not the mentor themselves. Never claim to be human.',
    'Do not include any internal, system, or XML tags (like <thinking>) in your reply — only the plain message text.',
  ].filter(Boolean).join('\n');
};

const mapHistoryToMessages = (history) =>
  history
    .filter((m) => typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.senderRole === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

const MOCK_DELAY_MS = Number(process.env.MOCK_AI_DELAY_MS) || 500;

const generateMockReply = async ({ mentor, studentMessage }) => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  if (process.env.MOCK_AI_FAIL === 'true') {
    throw new Error('Mock AI provider induced failure (MOCK_AI_FAIL=true)');
  }
  return `[MOCK AI] Thanks for asking — in a real deployment this would be a live reply from ${mentor.name || 'your mentor'}'s AI assistant, grounded in their profile. You said: "${studentMessage}"`;
};

const generateAnthropicReply = async ({ mentor, history }) => {
  // Lazy require so a deployment with only OPENAI_API_KEY configured never
  // needs this package to resolve.
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create(
    {
      // Haiku 4.5 is deliberately the default here: this is high-volume,
      // short-reply, latency-sensitive traffic inside a 2-minute chat
      // window — not a task that benefits from a frontier reasoning model.
      // Override via ANTHROPIC_MODEL for a larger model if quality warrants
      // the extra cost/latency once real usage is observed.
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystemPrompt(mentor),
      messages: mapHistoryToMessages(history),
    },
    { timeout: 15000 }
  );

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error(`Anthropic returned no text (stop_reason: ${response.stop_reason})`);
  }
  return textBlock.text;
};

const generateOpenAiReply = async ({ mentor, history }) => {
  const OpenAI = require('openai');
  const openai = new OpenAI();

  const response = await openai.chat.completions.create(
    {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 400,
      messages: [{ role: 'system', content: buildSystemPrompt(mentor) }, ...mapHistoryToMessages(history)],
    },
    { timeout: 15000 }
  );

  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned no text');
  return text;
};

/**
 * @param {{ mentor: object, history: Array<{senderRole:string,text:string}>, studentMessage: string }} args
 * @returns {Promise<string>}
 */
const generateMentorReply = async ({ mentor, history, studentMessage }) => {
  const provider = resolveProvider();
  if (!provider) throw new Error('No AI provider configured (set ANTHROPIC_API_KEY, OPENAI_API_KEY, or AI_PROVIDER=mock)');

  if (provider === 'mock') return generateMockReply({ mentor, history, studentMessage });
  if (provider === 'anthropic') return generateAnthropicReply({ mentor, history, studentMessage });
  return generateOpenAiReply({ mentor, history, studentMessage });
};

module.exports = { isConfigured, getActiveProvider, generateMentorReply };
