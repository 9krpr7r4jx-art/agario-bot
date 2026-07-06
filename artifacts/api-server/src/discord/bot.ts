import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Partials,
} from "discord.js";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../lib/logger";
import { isHack, isBotsReady } from "./agario-brain";

// ─── Gemini client (lazy-init so missing key is caught gracefully) ────────────

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly, knowledgeable Discord bot assistant. You can answer questions about ANYTHING: life, science, history, math, languages, music, sports, games (including Agario), culture, coding, food, travel, relationships, movies, animals — everything.

You have DEEP expertise in Agario and Agario Mobile (2015–2026): custom skins, DNA currency, split mechanics, trick splits, cannons, split feeds, viruses, teams, clans, clan wars, Battle Royale, events, battle pass, mystery boxes, daily missions, leveling, controls, strategies, glitches, server regions, and more.

RULES:
- Always respond in **English**
- Use Discord markdown: **bold**, bullet points (•), numbered lists, and relevant emojis
- Keep answers clear and helpful — not too long, not too short
- Be friendly and enthusiastic
- If you don't know something specific, be honest and suggest where to look
- NEVER discuss how to hack, cheat, or exploit any game or system — redirect those questions
- For Agario Mobile specifically: "Ashot" is a well-known member of the community server who creates bots and manages server features

FORMAT RULES for Discord:
- Max ~1800 characters per response (Discord limit)
- Use **bold** for key terms and section titles
- Use numbered lists for steps, bullet points for options
- Add 1–2 relevant emojis per section to make it visually clear`;

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

// ─── Ask Gemini ───────────────────────────────────────────────────────────────

async function askGemini(question: string): Promise<string> {
  const response = await getAI().models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: question }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 800,
      temperature: 0.7,
    },
  });

  const text = (response.text ?? "").trim();
  if (!text) return "I'm not sure how to answer that — could you rephrase? 🤔";
  // Cap at 1850 chars to stay safely under Discord's 2000-char limit
  return text.length > 1850 ? text.slice(0, 1850) + "…" : text;
}

// ─── Message handler ──────────────────────────────────────────────────────────

const ALLOWED_CHANNEL_ID = "1523745484232065116";

async function handleMessage(message: Message, client: Client): Promise<void> {
  if (message.author.bot || !message.guild) return;
  if (message.channelId !== ALLOWED_CHANNEL_ID) return;
  if (!message.mentions.has(client.user!)) return;

  // Strip bot mention(s) to get the real question
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
      `Hey ${ping}! 🤖 Ask me **anything** — Agario tips, life questions, games, science, history, coding, and more. I know it all!`,
    );
    return;
  }

  // ── Hack / cheat detection (deterministic — never reaches AI) ────────────
  if (isHack(question)) {
    const enzothekMention = await getEnzothekMention(message);
    const extraIds = enzothekCache.id ? [enzothekCache.id] : [];
    await safeReply(
      `${ping} I can't answer this question, sorry. Ping ${enzothekMention} to know 🙅`,
      extraIds,
    );
    return;
  }

  // ── "When will bots be ready / when will Ashot finish" ──────────────────
  if (isBotsReady(question)) {
    await safeReply(`${ping} Soon… get ready! 🎮`);
    return;
  }

  // ── Ask Gemini — answers everything ─────────────────────────────────────
  try {
    const answer = await askGemini(question);
    await safeReply(`${ping}\n\n${answer}`);
  } catch (err) {
    logger.error({ err }, "Gemini request failed");
    await safeReply(
      `${ping} I'm having a brain moment 😅 Try again in a second!`,
    );
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────────

export function startDiscordBot(): void {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start.");
    return;
  }
  if (!process.env["GEMINI_API_KEY"]) {
    logger.warn("GEMINI_API_KEY not set — Discord bot will not start.");
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
