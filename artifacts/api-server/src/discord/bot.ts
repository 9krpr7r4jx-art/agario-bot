import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Partials,
} from "discord.js";
import { logger } from "../lib/logger";
import {
  isAgarioRelated,
  findAnswer,
} from "./agario-knowledge";

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

// ─── Fallback response when we know it's Agario but have no specific answer ──

const AGARIO_FALLBACK_RESPONSES = [
  "I don't have specific info on that, but feel free to check the **agar.io wiki** (agario.fandom.com) or ask in the community — someone might know! 🟢",
  "That's a tricky one! Try searching on the **agar.io subreddit** (r/agario) or YouTube for a guide. 🎮",
  "I'm not sure about the details on that one. The **agar.io wiki** or Discord community members can help! Check #general.",
  "Hmm, I don't have that answer in my knowledge base. Try the agar.io wiki or ask an experienced player in the server!",
];

function getAgarioFallback(): string {
  return AGARIO_FALLBACK_RESPONSES[
    Math.floor(Math.random() * AGARIO_FALLBACK_RESPONSES.length)
  ]!;
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(message: Message, client: Client): Promise<void> {
  // Ignore bots and system messages
  if (message.author.bot || !message.guild) return;

  // Only operate in the designated channel
  const ALLOWED_CHANNEL_ID = "1523745484232065116";
  if (message.channelId !== ALLOWED_CHANNEL_ID) return;

  const isMentioned = message.mentions.has(client.user!);
  if (!isMentioned) return;

  // Strip the bot mention from the content to get the actual question
  const cleanContent = message.content
    .replace(/<@!?[0-9]+>/g, "")
    .trim();

  // allowedMentions: only ping the original author — never @everyone, @here, or roles
  const safeReply = (content: string) =>
    message.reply({
      content,
      allowedMentions: { users: [message.author.id], roles: [], parse: [] },
    });

  // If no actual content after stripping the mention
  if (!cleanContent) {
    await safeReply(
      `Hey <@${message.author.id}>! 🟢 Ask me anything about **Agario** or **Agario Mobile** — splits, viruses, DNA, skins, tricks, strategies, and more!`,
    );
    return;
  }

  // Special case: "when will bots be ready / when will Ashot finish"
  if (isBotsReadyQuestion(cleanContent)) {
    await safeReply(`<@${message.author.id}> Soon… get ready! 🎮`);
    return;
  }

  // Check if the question is Agario-related
  if (!isAgarioRelated(cleanContent)) {
    await safeReply(
      `<@${message.author.id}> I only answer questions about **Agario** and **Agario Mobile**! 🟢 Ask me about splits, viruses, DNA, skins, strategies, and more.`,
    );
    return;
  }

  // Look up the answer in the knowledge base
  const answer = findAnswer(cleanContent);

  if (answer) {
    await safeReply(`<@${message.author.id}>\n\n${answer}`);
  } else {
    // It's Agario-related but we don't have a specific answer
    await safeReply(`<@${message.author.id}> ${getAgarioFallback()}`);
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────────

export function startDiscordBot(): void {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start.");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
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
