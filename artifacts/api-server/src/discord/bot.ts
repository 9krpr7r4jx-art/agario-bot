import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Partials,
} from "discord.js";
import OpenAI from "openai";
import { logger } from "../lib/logger";
import { isHack, isBotsReady } from "./agario-brain";

// ─── Groq client (OpenAI-compatible, lazy init) ───────────────────────────────

let _groq: OpenAI | null = null;

function getGroq(): OpenAI {
  if (!_groq) {
    const key = process.env["GROQ_API_KEY"];
    if (!key) throw new Error("GROQ_API_KEY is not set");
    _groq = new OpenAI({
      apiKey: key,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return _groq;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a smart, friendly, and knowledgeable Discord bot. You can answer questions about EVERYTHING — there are no forbidden topics except hacking/cheating (see below). This includes:

- 🎮 All video games (Agario, Minecraft, Fortnite, Roblox, GTA, FIFA, etc.)
- 🌍 Life, culture, travel, relationships, philosophy
- 🔬 Science, biology, physics, chemistry, astronomy
- 📚 History, geography, literature, languages
- 🎵 Music, movies, TV shows, celebrities, pop culture
- 💻 Coding, technology, AI, internet
- 🧮 Math, logic, riddles
- 🐾 Animals, nature, food, sport
- 💬 Any language — always respond in the SAME LANGUAGE as the user's question

AGARIO EXPERTISE — you have deep knowledge of Agario & Agario Mobile (2015–2026):
• Custom skins: Profile → Edit Cell → Custom Skin (draw or import image, 512×512 PNG)
• DNA: free currency from ads (20–50 DNA/ad), daily missions, login streak, events
• Splits: trick split (feed+split simultaneously for extra range), multi-split (up to 16 cells), merge timer (~30–90s)
• Split feed & Cannon: teammates feed one player → massive split at enemies
• Viruses: touch if >133 mass = explode into 16 pieces; shoot by feeding a virus 7 times
• Teams, FFA, Battle Royale (shrinking map, Mobile exclusive), Party Mode (private rooms)
• Clans: create with tag [TAG], clan wars, roles (Leader/Officer/Member/Recruit)
• Events: seasonal (Halloween, Christmas, Summer), limited skins — prioritize them, they rarely return!
• Battle Pass, Mystery Boxes (Basic/Silver/Gold/Diamond), Daily Missions, XP/Level system
• Boost (Mobile only): speed burst, use to escape or catch enemies
• Lag fix: use WiFi, close apps, change server region, lower graphics
• Ashot: key community member who creates bots and server features

RULES:
1. LANGUAGE: Always reply in the exact same language the user writes in. If they write in French → answer in French. Spanish → Spanish. Arabic → Arabic. English → English. Never switch languages unless asked.
2. OFF-LIMITS (only these specific things): Auto-play bots/scripts, memory editors (Cheat Engine etc.), APK injection/tampering, and "unlimited DNA generators". These are the ONLY things you refuse. Say you can't help and keep it very short.
3. MODS ARE FINE: Game modifications (Shark Mod, texture packs, UI mods, visual mods, custom clients) are 100% OK to discuss fully. They are legitimate tools players use.
4. FORMAT: Use Discord markdown — **bold** for key terms, • bullet points, numbered steps. Add relevant emojis. Keep answers under ~1700 characters.
5. TONE: Be friendly, direct, and enthusiastic. Like a knowledgeable friend.
6. HONESTY: If unsure about something, say so and suggest where to look.`;

// ─── @enzothek mention resolver ───────────────────────────────────────────────

const ENZOTHEK_USERNAME = "enzothek";
const enzothekCache: { id: string | null; checkedAt: number } = {
  id: null,
  checkedAt: 0,
};

async function getEnzothekMention(message: Message): Promise<string> {
  const now = Date.now();
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
  return `@${ENZOTHEK_USERNAME}`;
}

// ─── Conversation history (per-user, in-memory) ───────────────────────────────

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface UserHistory {
  turns: Turn[];
  lastActivity: number;
}

const MAX_TURNS = 10;           // keep last 10 user+assistant pairs
const HISTORY_TTL_MS = 30 * 60 * 1000; // clear after 30 min of inactivity

const conversationHistory = new Map<string, UserHistory>();

function getHistory(userId: string): UserHistory {
  const now = Date.now();
  let hist = conversationHistory.get(userId);
  // Expire stale sessions
  if (hist && now - hist.lastActivity > HISTORY_TTL_MS) {
    conversationHistory.delete(userId);
    hist = undefined;
  }
  if (!hist) {
    hist = { turns: [], lastActivity: now };
    conversationHistory.set(userId, hist);
  }
  return hist;
}

function addTurn(userId: string, role: "user" | "assistant", content: string): void {
  const hist = getHistory(userId);
  hist.turns.push({ role, content });
  // Trim to MAX_TURNS pairs (each pair = 2 entries)
  if (hist.turns.length > MAX_TURNS * 2) {
    hist.turns.splice(0, hist.turns.length - MAX_TURNS * 2);
  }
  hist.lastActivity = Date.now();
}

// ─── Ask Groq ─────────────────────────────────────────────────────────────────

async function askGroq(userId: string, question: string): Promise<string> {
  // Record the new user message before calling the API
  addTurn(userId, "user", question);

  const hist = getHistory(userId);

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 700,
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      // Full conversation history gives context for follow-up questions
      ...hist.turns.map((t) => ({ role: t.role, content: t.content })),
    ],
  });

  const text = (completion.choices[0]?.message?.content ?? "").trim();
  const reply = text || "Je n'ai pas pu générer une réponse, réessaie ! 🤔";

  // Cap at 1850 chars to stay under Discord's 2000-char limit
  const finalReply = reply.length > 1850 ? reply.slice(0, 1850) + "…" : reply;

  // Record the assistant reply so future turns have context
  addTurn(userId, "assistant", finalReply);

  return finalReply;
}

// ─── Message handler ──────────────────────────────────────────────────────────

const ALLOWED_CHANNEL_ID = "1523745484232065116";

async function handleMessage(message: Message, client: Client): Promise<void> {
  if (message.author.bot || !message.guild) return;
  if (message.channelId !== ALLOWED_CHANNEL_ID) return;
  if (!message.mentions.has(client.user!)) return;

  // Strip bot mention(s) to get the actual question
  const question = message.content.replace(/<@!?[0-9]+>/g, "").trim();

  // Safe reply — only pings the author (+ optional extra users)
  const safeReply = (content: string, extraUsers: string[] = []) =>
    message.reply({
      content,
      allowedMentions: {
        users: [message.author.id, ...extraUsers],
        roles: [],
        parse: [],
      },
    });

  const ping = `<@${message.author.id}>`;

  // ── Empty mention ────────────────────────────────────────────────────────
  if (!question) {
    await safeReply(
      `Hey ${ping}! 🤖 Ask me **anything** — games, life, science, history, math, music, coding, and more. I understand all languages!`,
    );
    return;
  }

  // ── Hack / cheat (deterministic, never reaches AI) ───────────────────────
  if (isHack(question)) {
    const enzothekMention = await getEnzothekMention(message);
    const extraIds = enzothekCache.id ? [enzothekCache.id] : [];
    await safeReply(
      `${ping} I can't answer this question, sorry. Ping ${enzothekMention} to know 🙅`,
      extraIds,
    );
    return;
  }

  // ── Bots-ready / Ashot ───────────────────────────────────────────────────
  if (isBotsReady(question)) {
    await safeReply(`${ping} Soon… get ready! 🎮`);
    return;
  }

  // ── Ask Groq — answers everything in any language ────────────────────────
  try {
    const answer = await askGroq(message.author.id, question);
    await safeReply(`${ping}\n\n${answer}`);
  } catch (err: unknown) {
    logger.error({ err }, "Groq request failed");

    // Surface a friendlier message for rate-limit errors
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("rate_limit")) {
      await safeReply(
        `${ping} Je reçois trop de questions en ce moment ⏳ Réessaie dans quelques secondes !`,
      );
    } else {
      await safeReply(
        `${ping} Quelque chose s'est mal passé 😅 Réessaie !`,
      );
    }
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────────

export function startDiscordBot(): void {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start.");
    return;
  }
  if (!process.env["GROQ_API_KEY"]) {
    logger.warn("GROQ_API_KEY not set — Discord bot will not start.");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
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
