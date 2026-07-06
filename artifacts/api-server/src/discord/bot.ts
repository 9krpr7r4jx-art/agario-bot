import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Partials,
} from "discord.js";
import { logger } from "../lib/logger";
import {
  isHack,
  isBotsReady,
  isAgarioRelated,
  findAnswer,
} from "./agario-brain";

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

// ─── Fallback answers when topic is recognised but no specific intent matched ─

const AGARIO_FALLBACKS = [
  "That's a good question! I don't have a specific answer for that one right now. Try checking the **agar.io wiki** (agario.fandom.com) or ask in the community — someone will know! 🟢",
  "Hmm, I'm not sure about that specific detail. The **agar.io subreddit** (r/agario) and YouTube are great resources for deeper questions! 🎮",
  "I don't have that in my knowledge base yet. Try the **agar.io wiki** or ask an experienced player in the server!",
  "Great question, but that one's outside what I can answer right now. Check **Miniclip's official support** (miniclip.com/support) or the community wiki!",
];

function getAgarioFallback(): string {
  return AGARIO_FALLBACKS[Math.floor(Math.random() * AGARIO_FALLBACKS.length)]!;
}

// ─── Message handler ──────────────────────────────────────────────────────────

const ALLOWED_CHANNEL_ID = "1523745484232065116";

async function handleMessage(message: Message, client: Client): Promise<void> {
  if (message.author.bot || !message.guild) return;
  if (message.channelId !== ALLOWED_CHANNEL_ID) return;
  if (!message.mentions.has(client.user!)) return;

  // Strip the bot mention(s) to get the real question
  const question = message.content.replace(/<@!?[0-9]+>/g, "").trim();

  // Safe reply — only allows pinging the original author (+ optional extras)
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

  // ── Empty mention ─────────────────────────────────────────────────────────
  if (!question) {
    await safeReply(
      `Hey ${ping}! 🟢 Ask me anything about **Agario** or **Agario Mobile** — skins, DNA, splits, viruses, tricks, clans, strategies, and more!`,
    );
    return;
  }

  // ── Hack / cheat detection (deterministic, two layers) ────────────────────
  if (isHack(question)) {
    const enzothekMention = await getEnzothekMention(message);
    const extraIds = enzothekCache.id ? [enzothekCache.id] : [];
    await safeReply(
      `${ping} I can't answer this question, sorry. Ping ${enzothekMention} to know 🙅`,
      extraIds,
    );
    return;
  }

  // ── "When will bots be ready / when will Ashot finish" ───────────────────
  if (isBotsReady(question)) {
    await safeReply(`${ping} Soon… get ready! 🎮`);
    return;
  }

  // ── Off-topic detection ───────────────────────────────────────────────────
  if (!isAgarioRelated(question)) {
    await safeReply(
      `${ping} Sorry, I can only help with questions about **Agario** and **Agario Mobile**! 🟢\nAsk me about skins, DNA, splits, viruses, clans, strategies, and more.`,
    );
    return;
  }

  // ── Find the best matching answer ────────────────────────────────────────
  const answer = findAnswer(question);

  if (answer) {
    // Cap at 1900 chars to stay under Discord's 2000-char limit
    const safe = answer.length > 1900 ? answer.slice(0, 1900) + "…" : answer;
    await safeReply(`${ping}\n\n${safe}`);
  } else {
    // Topic recognised but no specific intent matched
    await safeReply(`${ping} ${getAgarioFallback()}`);
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
      GatewayIntentBits.GuildMembers, // needed to resolve @enzothek
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
