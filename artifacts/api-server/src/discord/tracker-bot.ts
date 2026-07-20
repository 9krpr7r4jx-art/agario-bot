import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { logger } from "../lib/logger";

// ─── Load web bot manager (ES module JS) ─────────────────────────────────

let _mgr: {
  startSession:       (userId: string, serverUrl: string, botName: string, botCount: number, ownerName?: string | null) => Promise<unknown>;
  stopSession:        (userId: string) => boolean;
  activeSessionCount: () => number;
} | null = null;

async function getMgr() {
  if (_mgr) return _mgr;
  const mod = await import("./bot-runtime/web-bot-manager.js");
  _mgr = mod as typeof _mgr;
  return _mgr!;
}

// ─── Constants ────────────────────────────────────────────────────────────

const OWNER_ID     = "1408012973473005619";
const MAX_SESSIONS = 50;
const DEFAULT_BOTS = 10;

// ─── State ────────────────────────────────────────────────────────────────

let botEnabled = false;

interface Session {
  userId:    string;
  username:  string;
  serverUrl: string;
  botName:   string;
  botCount:  number;
  ownerName: string;
  startedAt: Date;
}

const activeSessions = new Map<string, Session>();

// ─── Slash commands ───────────────────────────────────────────────────────

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Start Agario bots that join your party and follow you in-game")
    .addStringOption((o) =>
      o.setName("server_url")
        .setDescription('Party server URL — paste the "server" field from your party JSON (wss://...)')
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("bot_name")
        .setDescription("Name shown on the bots in-game")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("owner_name")
        .setDescription("Your in-game name — bots will follow and feed you")
        .setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName("bot_count")
        .setDescription(`Number of bots (1–50, default ${DEFAULT_BOTS})`)
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("stopsession")
    .setDescription("Stop your active bot session")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("boton")
    .setDescription("[Admin] Enable the tracker bot")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("botoff")
    .setDescription("[Admin] Disable the tracker bot")
    .toJSON(),
];

// ─── /tracker ─────────────────────────────────────────────────────────────

async function handleTracker(i: ChatInputCommandInteraction): Promise<void> {
  if (!botEnabled) {
    await i.reply({ content: "🔴 Bot not activated yet — wait for the admin to run `/boton`." });
    return;
  }
  if (activeSessions.has(i.user.id)) {
    await i.reply({ content: "⚠️ You already have an active session.\nUse `/stopsession` to stop it first." });
    return;
  }
  if (activeSessions.size >= MAX_SESSIONS) {
    await i.reply({ content: `⏳ All **${MAX_SESSIONS} slots** are in use. Try again later.` });
    return;
  }

  const serverUrl  = i.options.getString("server_url",  true).trim();
  const botName    = i.options.getString("bot_name",    true).trim();
  const ownerName  = i.options.getString("owner_name",  true).trim();
  const botCount   = i.options.getInteger("bot_count") ?? DEFAULT_BOTS;

  // Basic WSS URL validation
  if (!serverUrl.startsWith("wss://") && !serverUrl.startsWith("ws://")) {
    await i.reply({ content: "❌ Invalid server URL — it must start with `wss://`.\nPaste the `server` field from your party JSON." });
    return;
  }

  await i.deferReply();

  const session: Session = {
    userId:    i.user.id,
    username:  i.user.username,
    serverUrl,
    botName,
    ownerName,
    botCount,
    startedAt: new Date(),
  };

  try {
    const mgr = await getMgr();
    await mgr.startSession(i.user.id, serverUrl, botName, botCount, ownerName);
    activeSessions.set(i.user.id, session);
  } catch (err) {
    logger.error({ err }, "Tracker: startSession failed");
    await i.editReply({ content: "❌ Failed to start bots. Check the server URL and try again." });
    return;
  }

  const slotsFree = MAX_SESSIONS - activeSessions.size;

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("✅ Bot session started!")
    .addFields(
      { name: "🌐 Server",      value: `\`${serverUrl}\``,              inline: false },
      { name: "🤖 Bot name",    value: botName,                         inline: true  },
      { name: "👤 Following",   value: ownerName,                       inline: true  },
      { name: "🔢 Bot count",   value: `${botCount}`,                   inline: true  },
      { name: "📊 Slots free",  value: `${slotsFree} / ${MAX_SESSIONS}`, inline: true },
    )
    .setFooter({ text: "Use /stopsession to stop your bots." })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
  logger.info({ userId: i.user.id, serverUrl, botCount }, "Web tracker session started");
}

// ─── /stopsession ─────────────────────────────────────────────────────────

async function handleStopSession(i: ChatInputCommandInteraction): Promise<void> {
  const session = activeSessions.get(i.user.id);
  if (!session) {
    await i.reply({ content: "⚠️ You don't have an active session to stop." });
    return;
  }

  await i.deferReply();

  try {
    const mgr = await getMgr();
    mgr.stopSession(i.user.id);
  } catch (err) {
    logger.error({ err }, "Tracker: stopSession failed");
  }

  activeSessions.delete(i.user.id);
  const slotsFree = MAX_SESSIONS - activeSessions.size;

  await i.editReply({
    content:
      `🛑 **Session stopped.**\n` +
      `Your bots have left **${session.serverUrl}**.\n` +
      `📊 Slots available: **${slotsFree} / ${MAX_SESSIONS}**`,
  });
}

// ─── /boton ───────────────────────────────────────────────────────────────

async function handleBotOn(i: ChatInputCommandInteraction): Promise<void> {
  if (i.user.id !== OWNER_ID) {
    await i.reply({ content: "❌ Admin only." });
    return;
  }
  botEnabled = true;
  await i.reply({ content: "✅ **Tracker bot enabled.** Users can now use `/tracker`." });
}

// ─── /botoff ──────────────────────────────────────────────────────────────

async function handleBotOff(i: ChatInputCommandInteraction): Promise<void> {
  if (i.user.id !== OWNER_ID) {
    await i.reply({ content: "❌ Admin only." });
    return;
  }
  botEnabled = false;
  await i.reply({
    content:
      `🔴 **Tracker bot disabled.**\n` +
      `Active sessions still running: **${activeSessions.size}**`,
  });
}

// ─── Command registration ─────────────────────────────────────────────────

async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: COMMANDS });
    logger.info("Tracker bot: slash commands registered.");
  } catch (err) {
    logger.error({ err }, "Tracker bot: failed to register commands");
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────

export async function startTrackerBot(): Promise<void> {
  const token    = process.env["TRACKER_BOT_TOKEN"];
  const clientId = process.env["TRACKER_BOT_CLIENT_ID"];

  if (!token || !clientId) {
    logger.warn("TRACKER_BOT_TOKEN or TRACKER_BOT_CLIENT_ID missing — tracker bot disabled.");
    return;
  }

  // Pre-load web bot manager
  try {
    await getMgr();
    logger.info("Tracker: web bot manager loaded.");
  } catch (err) {
    logger.error({ err }, "Tracker: failed to load web bot manager");
  }

  await registerCommands(token, clientId);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    logger.info({ tag: c.user.tag }, "Tracker bot online");
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      switch (interaction.commandName) {
        case "tracker":     await handleTracker(interaction);     break;
        case "stopsession": await handleStopSession(interaction); break;
        case "boton":       await handleBotOn(interaction);       break;
        case "botoff":      await handleBotOff(interaction);      break;
      }
    } catch (err) {
      logger.error({ err }, "Tracker bot: unhandled error");
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Unexpected error. Please try again!" });
      }
    }
  });

  client.on(Events.Error, (err) => logger.error({ err }, "Tracker bot: client error"));

  client.login(token).catch((err) =>
    logger.error({ err }, "Tracker bot: login failed"),
  );
}
