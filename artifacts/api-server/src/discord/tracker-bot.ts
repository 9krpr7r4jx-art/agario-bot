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
import { createRequire } from "module";

// ─── Load the JS bot-manager (ESM-compatible via dynamic import) ───────────

const _require = createRequire(import.meta.url);

let _botManager: {
  startSession:       (userId: string, serverUrl: string, botName: string, botCount: number) => unknown;
  stopSession:        (userId: string) => boolean;
  buildServerUrl:     (regionHostname: string, gameMode: string, partyCode: string) => string;
  activeSessionCount: () => number;
} | null = null;

async function getBotManager() {
  if (_botManager) return _botManager;
  // Dynamic import so esbuild bundles it but loads it at runtime
  const mod = await import("./bot-runtime/agario-bot-manager.js");
  _botManager = mod as typeof _botManager;
  return _botManager!;
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
  region:    string;
  partyCode: string;
  gameMode:  "Burst" | "Classic";
  targetUid: string;
  botName:   string;
  serverUrl: string;
  botCount:  number;
  startedAt: Date;
}

const activeSessions = new Map<string, Session>();

// ─── Regions ──────────────────────────────────────────────────────────────

const REGIONS = [
  { name: "🇺🇸 US East 1",    value: "us-east-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇺🇸 US East 2",    value: "us-east-2.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇺🇸 US West",      value: "us-west-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇯🇵 AP Northeast", value: "ap-northeast-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇸🇬 AP Southeast", value: "ap-southeast-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇩🇪 EU Central",   value: "eu-central-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇬🇧 EU West 2",    value: "eu-west-2.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇫🇷 EU West 3",    value: "eu-west-3.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇧🇷 SA East",      value: "sa-east-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇦🇪 Middle East",  value: "me-south-1.mobile-live-v26.agario.miniclippt.com" },
];

// ─── Slash command definitions ────────────────────────────────────────────

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Start Agario bots that follow & feed your account")
    .addStringOption((o) =>
      o.setName("region")
        .setDescription("Server region")
        .setRequired(true)
        .addChoices(...REGIONS.map((r) => ({ name: r.name, value: r.value }))),
    )
    .addStringOption((o) =>
      o.setName("game_mode")
        .setDescription("Game mode")
        .setRequired(true)
        .addChoices(
          { name: "⚡ Burst",    value: "Burst"   },
          { name: "🕹️ Classic", value: "Classic" },
        ),
    )
    .addStringOption((o) =>
      o.setName("uid")
        .setDescription("Your Agario UID — bots will find and follow you")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("bot_name")
        .setDescription("Name shown on the bots in-game")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("party_code")
        .setDescription("Party code to join (leave empty for public)")
        .setRequired(false),
    )
    .addStringOption((o) =>
      o.setName("server_url")
        .setDescription("Full WebSocket URL (wss://...) — overrides auto-detection")
        .setRequired(false),
    )
    .addIntegerOption((o) =>
      o.setName("bot_count")
        .setDescription(`Number of bots to spawn (1–50, default ${DEFAULT_BOTS})`)
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("stopsession")
    .setDescription("Stop your active bot session and free the slot")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("boton")
    .setDescription("[Admin] Enable the tracker bot for everyone")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("botoff")
    .setDescription("[Admin] Disable the tracker bot")
    .toJSON(),
];

// ─── /tracker ─────────────────────────────────────────────────────────────

async function handleTracker(i: ChatInputCommandInteraction): Promise<void> {
  if (!botEnabled) {
    await i.reply({ content: "🔴 Bot is not activated yet, please wait — Ashot will activate it." });
    return;
  }
  if (activeSessions.has(i.user.id)) {
    await i.reply({ content: "⚠️ You already have an active session!\nUse `/stopsession` to stop it first." });
    return;
  }
  if (activeSessions.size >= MAX_SESSIONS) {
    await i.reply({ content: `⏳ All **${MAX_SESSIONS} sessions** are currently active.\nPlease wait until someone frees a slot.` });
    return;
  }

  await i.deferReply();

  const region    = i.options.getString("region",     true);
  const gameMode  = i.options.getString("game_mode",  true) as "Burst" | "Classic";
  const targetUid = i.options.getString("uid",        true).trim();
  const botName   = i.options.getString("bot_name",   true).trim();
  const partyCode = i.options.getString("party_code") ?? "Public";
  const botCount  = i.options.getInteger("bot_count") ?? DEFAULT_BOTS;
  const serverUrlOverride = i.options.getString("server_url") ?? null;

  // Build / use the WebSocket URL
  let serverUrl: string;
  try {
    const mgr = await getBotManager();
    serverUrl = serverUrlOverride ?? mgr!.buildServerUrl(region, gameMode, partyCode);
  } catch (err) {
    logger.error({ err }, "Failed to build server URL");
    await i.editReply({ content: "❌ Could not build the server URL. Try providing one manually via `server_url`." });
    return;
  }

  const session: Session = {
    userId:    i.user.id,
    username:  i.user.username,
    region,
    partyCode,
    gameMode,
    targetUid,
    botName,
    serverUrl,
    botCount,
    startedAt: new Date(),
  };

  activeSessions.set(i.user.id, session);

  // ── Actually start the bots ──────────────────────────────────────────
  try {
    const mgr = await getBotManager();
    mgr!.startSession(i.user.id, serverUrl, botName, botCount);
  } catch (err) {
    activeSessions.delete(i.user.id);
    logger.error({ err }, "Tracker: startSession failed");
    await i.editReply({ content: "❌ Failed to start bots. Check that the server URL is correct and try again." });
    return;
  }

  const regionLabel = REGIONS.find((r) => r.value === region)?.name ?? region;
  const slotsFree   = MAX_SESSIONS - activeSessions.size;

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("✅ Bot session started!")
    .addFields(
      { name: "🌍 Region",      value: regionLabel,           inline: true },
      { name: "🎮 Mode",        value: gameMode,               inline: true },
      { name: "🔑 Party code",  value: partyCode,              inline: true },
      { name: "🆔 Target UID",  value: `\`${targetUid}\``,    inline: true },
      { name: "🤖 Bot name",    value: botName,                inline: true },
      { name: "🔢 Bots",        value: `${botCount}`,          inline: true },
      { name: "📊 Slots left",  value: `${slotsFree} / ${MAX_SESSIONS}`, inline: true },
      { name: "🔗 Server URL",  value: `\`${serverUrl}\``,    inline: false },
    )
    .setFooter({ text: "Use /stopsession to stop your bots at any time." })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });

  logger.info({ userId: i.user.id, serverUrl, botCount }, "Tracker session started");
}

// ─── /stopsession ─────────────────────────────────────────────────────────

async function handleStopSession(i: ChatInputCommandInteraction): Promise<void> {
  const session = activeSessions.get(i.user.id);

  if (!session) {
    await i.reply({ content: "⚠️ You have no active session to stop." });
    return;
  }

  await i.deferReply();

  try {
    const mgr = await getBotManager();
    mgr!.stopSession(i.user.id);
  } catch (err) {
    logger.error({ err }, "Tracker: stopSession failed");
  }

  activeSessions.delete(i.user.id);

  const slotsFree = MAX_SESSIONS - activeSessions.size;

  await i.editReply({
    content:
      `🛑 **Session stopped.**\n` +
      `Your bots have disconnected from **${session.region} — ${session.gameMode}**.\n` +
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
  await i.reply({
    content: "✅ **Tracker bot is now ON.**\nAll users can start sessions with `/tracker`.",
  });
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
      `🔴 **Tracker bot is now OFF.**\n` +
      `Active sessions running: **${activeSessions.size}**\n` +
      `New \`/tracker\` calls will be rejected.`,
  });
}

// ─── Command registration ─────────────────────────────────────────────────

async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: COMMANDS });
    logger.info("Tracker bot: slash commands registered globally.");
  } catch (err) {
    logger.error({ err }, "Tracker bot: failed to register slash commands");
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────

export async function startTrackerBot(): Promise<void> {
  const token    = process.env["TRACKER_BOT_TOKEN"];
  const clientId = process.env["TRACKER_BOT_CLIENT_ID"];

  if (!token || !clientId) {
    logger.warn("TRACKER_BOT_TOKEN or TRACKER_BOT_CLIENT_ID missing — tracker bot will not start.");
    return;
  }

  // Pre-load the bot manager module at startup
  try {
    await getBotManager();
    logger.info("Tracker: bot manager loaded OK.");
  } catch (err) {
    logger.error({ err }, "Tracker: failed to load bot manager — bots will not spawn.");
  }

  await registerCommands(token, clientId);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    logger.info({ tag: c.user.tag }, "Tracker bot is online");
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      switch (interaction.commandName) {
        case "tracker":      await handleTracker(interaction);     break;
        case "stopsession":  await handleStopSession(interaction); break;
        case "boton":        await handleBotOn(interaction);       break;
        case "botoff":       await handleBotOff(interaction);      break;
      }
    } catch (err) {
      logger.error({ err }, "Tracker bot: unhandled interaction error");
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Something went wrong. Try again!" });
      }
    }
  });

  client.on(Events.Error, (err) =>
    logger.error({ err }, "Tracker bot: client error"),
  );

  client.login(token).catch((err) =>
    logger.error({ err }, "Tracker bot: failed to login"),
  );
}
