import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Partials,
} from "discord.js";
import OpenAI from "openai";
import { logger } from "../lib/logger";
import { AGARIO_SYSTEM_PROMPT } from "./agario-prompt";

// ─── OpenAI client ────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

// ─── Deterministic hack keyword pre-filter ────────────────────────────────────
// These patterns catch obvious cases before/after AI classification, preventing
// policy bypass if the model returns malformed or adversarial output.

const HACK_PATTERNS = [
  /\b(hack|hacking|hacked)\b/i,
  /\b(cheat|cheating|cheater)\b/i,
  /\bmod[\s-]?menu\b/i,
  /\b(aimbot|speedhack|wallhack|noclip|no[\s-]?clip)\b/i,
  /\b(unlimited[\s-]?dna|free[\s-]?dna[\s-]?hack|dna[\s-]?generator)\b/i,
  /\b(cheat[\s-]?engine|memory[\s-]?edit|apk[\s-]?mod|modded[\s-]?apk)\b/i,
  /\b(auto[\s-]?split[\s-]?bot|bot[\s-]?script|auto[\s-]?play)\b/i,
  /\b(exploit|exploiting)\b/i,
  /\b(bypass|spoof|tamper)\b/i,
  /how\s+to\s+get\s+(infinite|unlimited|free)\s+dna/i,
];

function isDefinitelyHack(text: string): boolean {
  return HACK_PATTERNS.some((p) => p.test(text));
}

// ─── Special-case patterns (bots-ready / Ashot) ───────────────────────────────

const BOTS_READY_PATTERNS = [
  /when\s+(are?\s+)?the\s+bots?\s+(going\s+to\s+be\s+)?(ready|done|finish)/i,
  /when\s+will\s+(the\s+)?bots?\s+be\s+(ready|done|finish)/i,
  /bots?\s+(ready|done)\s+when/i,
  /when\s+is?\s+ashot\s+(going\s+to\s+)?(finish|done|ready|complet)/i,
  /when\s+will\s+ashot\s+(finish|be\s+done|complet)/i,
  /ashot.*bot.*when/i,
  /when.*ashot.*bot/i,
  /quand.*bots?\s+(pr[eê]t|fini|termin)/i,
  /quand.*ashot.*(finir|termin|fini)/i,
  /les\s+bots?\s+(sont\s+)?(pr[eê]t|fini|termin)\s+quand/i,
];

function isBotsReadyQuestion(text: string): boolean {
  return BOTS_READY_PATTERNS.some((p) => p.test(text));
}

// ─── AI response types ────────────────────────────────────────────────────────

interface AIResponse {
  type: "answer" | "off_topic" | "hack";
  message: string;
}

// ─── Ask OpenAI ───────────────────────────────────────────────────────────────

const DISCORD_MAX_CHARS = 1900; // safe limit under Discord's 2000-char max

async function askAI(question: string): Promise<AIResponse> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: AGARIO_SYSTEM_PROMPT },
      { role: "user", content: question },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Completely malformed JSON — safe error, never expose raw model text
    logger.warn({ raw }, "OpenAI returned non-JSON — returning safe error");
    return {
      type: "off_topic",
      message: "I had trouble processing that. Please try rephrasing your question! 😅",
    };
  }

  const obj = parsed as Record<string, unknown>;
  const validTypes = ["answer", "off_topic", "hack"] as const;

  if (!validTypes.includes(obj["type"] as typeof validTypes[number])) {
    logger.warn({ type: obj["type"] }, "OpenAI returned invalid type — defaulting to error");
    return {
      type: "off_topic",
      message: "I had trouble processing that. Please try rephrasing your question! 😅",
    };
  }

  const type = obj["type"] as AIResponse["type"];
  const rawMessage = typeof obj["message"] === "string" ? obj["message"] : String(obj["message"] ?? "");

  // Cap message length to stay within Discord limits
  const message = rawMessage.length > DISCORD_MAX_CHARS
    ? rawMessage.slice(0, DISCORD_MAX_CHARS) + "…"
    : rawMessage;

  return { type, message };
}

// ─── Resolve @enzothek user ID in the guild ───────────────────────────────────

const ENZOTHEK_USERNAME = "enzothek";
const enzothekCache: { id: string | null; checkedAt: number } = {
  id: null,
  checkedAt: 0,
};

async function getEnzothekMention(
  message: Message,
): Promise<string> {
  const now = Date.now();
  // Refresh cache every 10 minutes
  if (enzothekCache.id && now - enzothekCache.checkedAt < 10 * 60 * 1000) {
    return `<@${enzothekCache.id}>`;
  }

  try {
    if (message.guild) {
      const members = await message.guild.members.search({
        query: ENZOTHEK_USERNAME,
        limit: 5,
      });

      const found = members.find(
        (m) =>
          m.user.username.toLowerCase() === ENZOTHEK_USERNAME ||
          m.displayName.toLowerCase() === ENZOTHEK_USERNAME ||
          (m.user.globalName ?? "").toLowerCase() === ENZOTHEK_USERNAME,
      );

      if (found) {
        enzothekCache.id = found.id;
        enzothekCache.checkedAt = now;
        return `<@${found.id}>`;
      }
    }
  } catch (err) {
    logger.warn({ err }, "Could not search guild members for enzothek");
  }

  // Fallback: plain text mention
  return `@${ENZOTHEK_USERNAME}`;
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(message: Message, client: Client): Promise<void> {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;

  // Only operate in the designated channel
  const ALLOWED_CHANNEL_ID = "1523745484232065116";
  if (message.channelId !== ALLOWED_CHANNEL_ID) return;

  // Only respond when directly mentioned
  if (!message.mentions.has(client.user!)) return;

  // Strip the bot mention(s) from message content
  const cleanContent = message.content.replace(/<@!?[0-9]+>/g, "").trim();

  // Safe reply — only pings the original author, never roles or @everyone
  const safeReply = (
    content: string,
    extraAllowedUsers: string[] = [],
  ) =>
    message.reply({
      content,
      allowedMentions: {
        users: [message.author.id, ...extraAllowedUsers],
        roles: [],
        parse: [],
      },
    });

  // Empty mention — show help
  if (!cleanContent) {
    await safeReply(
      `Hey <@${message.author.id}>! 🟢 Ask me anything about **Agario** or **Agario Mobile** — skins, DNA, splits, viruses, tricks, clans, strategies, and more!`,
    );
    return;
  }

  // Fast path: "when will bots be ready / when will Ashot finish"
  if (isBotsReadyQuestion(cleanContent)) {
    await safeReply(`<@${message.author.id}> Soon… get ready! 🎮`);
    return;
  }

  // Deterministic hack pre-check — catches obvious cases before calling AI
  // so policy cannot be bypassed even if the model misbehaves
  if (isDefinitelyHack(cleanContent)) {
    const enzothekMention = await getEnzothekMention(message);
    const extraIds = enzothekCache.id ? [enzothekCache.id] : [];
    await safeReply(
      `<@${message.author.id}> I can't answer this question, sorry. Ping ${enzothekMention} to know 🙅`,
      extraIds,
    );
    return;
  }

  // ── Ask the AI ──────────────────────────────────────────────────────────────
  let aiResponse: AIResponse;
  try {
    aiResponse = await askAI(cleanContent);
  } catch (err) {
    logger.error({ err }, "OpenAI request failed");
    await safeReply(
      `<@${message.author.id}> I'm having trouble thinking right now. Please try again in a moment! 😅`,
    );
    return;
  }

  // ── Route based on response type ────────────────────────────────────────────
  // Deterministic post-check: override AI if it missed an obvious hack question
  if (aiResponse.type === "hack" || isDefinitelyHack(cleanContent)) {
    const enzothekMention = await getEnzothekMention(message);
    const extraIds = enzothekCache.id ? [enzothekCache.id] : [];
    await safeReply(
      `<@${message.author.id}> I can't answer this question, sorry. Ping ${enzothekMention} to know 🙅`,
      extraIds,
    );
    return;
  }

  if (aiResponse.type === "off_topic") {
    await safeReply(`<@${message.author.id}> ${aiResponse.message}`);
    return;
  }

  // Normal Agario answer — length already capped in askAI()
  await safeReply(`<@${message.author.id}>\n\n${aiResponse.message}`);
}

// ─── Bot startup ──────────────────────────────────────────────────────────────

export function startDiscordBot(): void {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start.");
    return;
  }

  if (!process.env["OPENAI_API_KEY"]) {
    logger.warn("OPENAI_API_KEY not set — Discord bot will not start.");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,   // needed to search for @enzothek
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  });

  client.on(Events.MessageCreate, (message) => {
    handleMessage(message, client).catch((err) => {
      logger.error({ err }, "Unhandled error in Discord message handler");
    });
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });
}
