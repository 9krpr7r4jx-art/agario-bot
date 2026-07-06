import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Partials,
} from "discord.js";
import OpenAI from "openai";
import { logger } from "../lib/logger";

// ─── OpenAI client ────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

// ─── Special-case patterns ────────────────────────────────────────────────────

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
  return BOTS_READY_PATTERNS.some((pattern) => pattern.test(text));
}

// ─── AI helpers ───────────────────────────────────────────────────────────────

async function isAgarioRelated(text: string): Promise<boolean> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 10,
    messages: [
      {
        role: "system",
        content:
          'You are a classifier. Respond ONLY with "yes" or "no". Is the user message related to the game Agario (agar.io), its mechanics, cells, DNA, skins, servers, gameplay, strategies, clans, or the Agario mobile game?',
      },
      { role: "user", content: text },
    ],
  });
  const answer = response.choices[0]?.message?.content?.toLowerCase().trim() ?? "";
  // Be permissive: accept "yes", "yes.", "yes!" etc.
  return answer.startsWith("yes");
}

async function generateAgarioAnswer(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 512,
    messages: [
      {
        role: "system",
        content: `You are AgarioBot, a helpful assistant for an Agario and Agario Mobile community Discord server.
You ONLY answer questions about Agario (agar.io) and Agario Mobile — including gameplay mechanics, DNA currency, skins, servers, strategies, clans, game updates, and the community.
Answer clearly and concisely in English. Be friendly and accurate.
Do not answer anything unrelated to Agario.`,
      },
      { role: "user", content: text },
    ],
  });
  return (
    response.choices[0]?.message?.content?.trim() ??
    "Sorry, I couldn't generate an answer. Please try again!"
  );
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(message: Message, client: Client): Promise<void> {
  // Ignore bots and system messages
  if (message.author.bot || !message.guild) return;

  const isMentioned = message.mentions.has(client.user!);
  if (!isMentioned) return;

  // Strip the bot mention from the content to get the actual question
  const cleanContent = message.content
    .replace(/<@!?[0-9]+>/g, "")
    .trim();

  // allowedMentions: only ping the original author — never @everyone, @here, or roles,
  // even if the LLM output contains such strings.
  const safeReply = (content: string) =>
    message.reply({
      content,
      allowedMentions: { users: [message.author.id], roles: [], parse: [] },
    });

  // If no actual content after stripping the mention
  if (!cleanContent) {
    await safeReply(
      `Hey <@${message.author.id}>! Ask me anything about **Agario** or **Agario Mobile** — gameplay, DNA, skins, servers, strategies, and more!`,
    );
    return;
  }

  // Special case: "when will bots be ready / when will Ashot finish"
  if (isBotsReadyQuestion(cleanContent)) {
    await safeReply(`<@${message.author.id}> Soon… get ready! 🎮`);
    return;
  }

  // Classify the question
  let agarioRelated: boolean;
  try {
    agarioRelated = await isAgarioRelated(cleanContent);
  } catch (err) {
    logger.error({ err }, "OpenAI classification error");
    await safeReply(
      `<@${message.author.id}> Sorry, I'm having trouble right now. Please try again in a moment!`,
    );
    return;
  }

  if (!agarioRelated) {
    await safeReply(
      `<@${message.author.id}> I only answer questions about **Agario** and **Agario Mobile**! 🟢 Ask me about gameplay, DNA, skins, servers, strategies, and more.`,
    );
    return;
  }

  // Generate an Agario-specific answer
  let answer: string;
  try {
    answer = await generateAgarioAnswer(cleanContent);
  } catch (err) {
    logger.error({ err }, "OpenAI answer generation error");
    await safeReply(
      `<@${message.author.id}> Sorry, I couldn't generate an answer right now. Please try again!`,
    );
    return;
  }

  await safeReply(`<@${message.author.id}> ${answer}`);
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
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
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
