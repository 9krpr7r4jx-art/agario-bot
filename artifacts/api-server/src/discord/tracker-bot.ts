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

// ─── Constants ────────────────────────────────────────────────────────────────

const OWNER_ID    = "1408012973473005619";
const MAX_SESSIONS = 50;

// ─── State ────────────────────────────────────────────────────────────────────

let botEnabled = false;

interface Session {
  userId: string;
  username: string;
  region: string;
  partyCode: string;
  gameMode: "Burst" | "Classic";
  targetUid: string;
  botName: string;
  startedAt: Date;
}

// userId → Session
const activeSessions = new Map<string, Session>();

// ─── Agario Bot Controller (plug in your API here) ────────────────────────────
//
// TODO: Replace these two stubs with real calls to your Agario bot system.
//   startBots(session)  → connect bots to the game, find targetUid, follow+feed
//   stopBots(userId)    → disconnect that user's bots
//
// Example:
//   await fetch("http://your-bot-server/start", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ region, partyCode, gameMode, targetUid, botName }),
//   });

async function startBots(session: Session): Promise<void> {
  logger.info(
    {
      user:      session.username,
      region:    session.region,
      partyCode: session.partyCode,
      mode:      session.gameMode,
      uid:       session.targetUid,
      botName:   session.botName,
    },
    "Tracker: starting bots (API stub — wire your bot system here)",
  );
}

async function stopBots(userId: string): Promise<void> {
  logger.info({ userId }, "Tracker: stopping bots (API stub)");
}

// ─── Regions (update this list to match your server regions) ──────────────────

// Real Agario Mobile server regions (from Slice_Default Settings - Regions.plist)
const REGIONS = [
  { name: "🇺🇸 US East 1",       value: "us-east-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇺🇸 US East 2",       value: "us-east-2.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇺🇸 US West",         value: "us-west-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇯🇵 AP Northeast",    value: "ap-northeast-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇸🇬 AP Southeast",    value: "ap-southeast-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇩🇪 EU Central",      value: "eu-central-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇬🇧 EU West 2",       value: "eu-west-2.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇫🇷 EU West 3",       value: "eu-west-3.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇧🇷 SA East",         value: "sa-east-1.mobile-live-v26.agario.miniclippt.com" },
  { name: "🇦🇪 Middle East",     value: "me-south-1.mobile-live-v26.agario.miniclippt.com" },
];

// ─── Slash command definitions ────────────────────────────────────────────────

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Start Agario bots that follow & feed your account")
    .addStringOption((o) =>
      o
        .setName("region")
        .setDescription("Server region to connect to")
        .setRequired(true)
        .addChoices(...REGIONS.map((r) => ({ name: r.name, value: r.value }))),
    )
    .addStringOption((o) =>
      o
        .setName("game_mode")
        .setDescription("Game mode")
        .setRequired(true)
        .addChoices(
          { name: "⚡ Burst",   value: "Burst"   },
          { name: "🕹️ Classic", value: "Classic" },
        ),
    )
    .addStringOption((o) =>
      o
        .setName("uid")
        .setDescription("Your Agario UID — bots will find and follow you")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("bot_name")
        .setDescription("Name displayed on the bots in-game")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("party_code")
        .setDescription("Party code to join (leave empty for public)")
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

// ─── /tracker ─────────────────────────────────────────────────────────────────

async function handleTracker(i: ChatInputCommandInteraction): Promise<void> {
  // 1. Bot enabled?
  if (!botEnabled) {
    await i.reply({
      content: "🔴 Bot is not activated yet, please wait — Ashot will activate it.",
    });
    return;
  }

  // 2. User already has a session?
  if (activeSessions.has(i.user.id)) {
    await i.reply({
      content:
        "⚠️ You already have an active session!\nUse `/stopsession` to stop it first.",
    });
    return;
  }

  // 3. Max sessions reached?
  if (activeSessions.size >= MAX_SESSIONS) {
    await i.reply({
      content:
        "⏳ All **50 sessions** are currently active.\nPlease wait until someone frees a slot.",
    });
    return;
  }

  await i.deferReply();

  const region    = i.options.getString("region",    true) as string;
  const partyCode = i.options.getString("party_code") ?? "Public";
  const gameMode  = i.options.getString("game_mode",  true) as "Burst" | "Classic";
  const targetUid = i.options.getString("uid",        true).trim();
  const botName   = i.options.getString("bot_name",   true).trim();

  const session: Session = {
    userId: i.user.id,
    username: i.user.username,
    region,
    partyCode,
    gameMode,
    targetUid,
    botName,
    startedAt: new Date(),
  };

  activeSessions.set(i.user.id, session);

  try {
    await startBots(session);
  } catch (err) {
    activeSessions.delete(i.user.id);
    logger.error({ err }, "Tracker: startBots failed");
    await i.editReply({
      content: "❌ Failed to start bots. Please try again.",
    });
    return;
  }

  const regionLabel = REGIONS.find((r) => r.value === region)?.name ?? region;
  const slotsFree   = MAX_SESSIONS - activeSessions.size;

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("✅ Bot session started!")
    .addFields(
      { name: "🌍 Region",     value: regionLabel,     inline: true },
      { name: "🎮 Mode",       value: gameMode,         inline: true },
      { name: "🔑 Party code", value: partyCode,        inline: true },
      { name: "🆔 Target UID", value: `\`${targetUid}\``, inline: true },
      { name: "🤖 Bot name",   value: botName,          inline: true },
      { name: "📊 Slots left", value: `${slotsFree} / ${MAX_SESSIONS}`, inline: true },
    )
    .setFooter({ text: "Use /stopsession to stop your bots at any time." })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
}

// ─── /stopsession ─────────────────────────────────────────────────────────────

async function handleStopSession(i: ChatInputCommandInteraction): Promise<void> {
  const session = activeSessions.get(i.user.id);

  if (!session) {
    await i.reply({
      content: "⚠️ You have no active session to stop.",
    });
    return;
  }

  await i.deferReply();

  try {
    await stopBots(i.user.id);
  } catch (err) {
    logger.error({ err }, "Tracker: stopBots failed");
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

// ─── /boton ───────────────────────────────────────────────────────────────────

async function handleBotOn(i: ChatInputCommandInteraction): Promise<void> {
  if (i.user.id !== OWNER_ID) {
    await i.reply({ content: "❌ Admin only." });
    return;
  }
  botEnabled = true;
  await i.reply({
    content:
      "✅ **Tracker bot is now ON.**\nAll users can start sessions with `/tracker`.",
    ephemeral: false, // visible to everyone so they know it's open
  });
}

// ─── /botoff ──────────────────────────────────────────────────────────────────

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
    ephemeral: false,
  });
}

// ─── Command registration ─────────────────────────────────────────────────────

async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: COMMANDS });
    logger.info("Tracker bot: slash commands registered globally.");
  } catch (err) {
    logger.error({ err }, "Tracker bot: failed to register slash commands");
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────────

export async function startTrackerBot(): Promise<void> {
  const token    = process.env["TRACKER_BOT_TOKEN"];
  const clientId = process.env["TRACKER_BOT_CLIENT_ID"];

  if (!token || !clientId) {
    logger.warn("TRACKER_BOT_TOKEN or TRACKER_BOT_CLIENT_ID missing — tracker bot will not start.");
    return;
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
        await interaction.reply({
          content: "❌ Something went wrong. Try again!",
        });
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
