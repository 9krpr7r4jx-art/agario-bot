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

// ─── Load mobile bot manager (ES module JS) ───────────────────────────────

let _mgr: {
  startSession:       (userId: string, host: string, port: number, botName: string, botCount: number, uid: string | null, partyCode?: string | null) => unknown;
  stopSession:        (userId: string) => boolean;
  buildMobileHost:    (regionHostname: string) => string;
  uidToAccountId:     (uid: string) => number | null;
  activeSessionCount: () => number;
} | null = null;

async function getMgr() {
  if (_mgr) return _mgr;
  const mod = await import("./bot-runtime/mobile-bot-manager.js");
  _mgr = mod as typeof _mgr;
  return _mgr!;
}

// ─── Constants ────────────────────────────────────────────────────────────

const OWNER_ID     = "1408012973473005619";
const MAX_SESSIONS = 50;
const DEFAULT_BOTS = 10;
const MOBILE_PORT  = 9000;

// ─── State ────────────────────────────────────────────────────────────────

let botEnabled = false;

interface Session {
  userId:    string;
  username:  string;
  host:      string;
  port:      number;
  partyCode: string;
  gameMode:  string;
  targetUid: string;
  botName:   string;
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

// ─── Slash commands ───────────────────────────────────────────────────────

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Start Agario Mobile bots that follow & feed your account (TCP port 9000)")
    .addStringOption((o) =>
      o.setName("region")
        .setDescription("Mobile server region")
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
        .setDescription("Your Agario UID — bots will find and follow you in-game")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("bot_name")
        .setDescription("Name shown on the bots in-game")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("party_code")
        .setDescription("Party code (if you want bots in your private room)")
        .setRequired(false),
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
    await i.reply({ content: "🔴 Bot not activated yet — attendez qu'Ashot l'active avec `/boton`." });
    return;
  }
  if (activeSessions.has(i.user.id)) {
    await i.reply({ content: "⚠️ Tu as déjà une session active.\nUtilise `/stopsession` pour l'arrêter." });
    return;
  }
  if (activeSessions.size >= MAX_SESSIONS) {
    await i.reply({ content: `⏳ Toutes les **${MAX_SESSIONS} sessions** sont utilisées. Réessaie plus tard.` });
    return;
  }

  await i.deferReply();

  const regionHostname = i.options.getString("region",    true);
  const gameMode       = i.options.getString("game_mode", true);
  const targetUid      = i.options.getString("uid",       true).trim();
  const botName        = i.options.getString("bot_name",  true).trim();
  const partyCode      = i.options.getString("party_code") ?? "Public";
  const botCount       = i.options.getInteger("bot_count") ?? DEFAULT_BOTS;

  const mgr  = await getMgr();
  const host = mgr.buildMobileHost(regionHostname);

  const session: Session = {
    userId:    i.user.id,
    username:  i.user.username,
    host,
    port:      MOBILE_PORT,
    partyCode,
    gameMode,
    targetUid,
    botName,
    botCount,
    startedAt: new Date(),
  };

  // Start TCP bots
  try {
    mgr.startSession(i.user.id, host, MOBILE_PORT, botName, botCount, targetUid, partyCode === "Public" ? null : partyCode);
    activeSessions.set(i.user.id, session);
  } catch (err) {
    logger.error({ err }, "Tracker: startSession failed");
    await i.editReply({ content: "❌ Impossible de démarrer les bots. Vérifie la région et réessaie." });
    return;
  }

  const regionLabel = REGIONS.find((r) => r.value === regionHostname)?.name ?? regionHostname;
  const slotsFree   = MAX_SESSIONS - activeSessions.size;

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("✅ Session de bots démarrée !")
    .addFields(
      { name: "🌍 Région",       value: regionLabel,                        inline: true },
      { name: "🎮 Mode",         value: gameMode,                            inline: true },
      { name: "🔑 Code partie",  value: partyCode,                          inline: true },
      { name: "🆔 UID cible",    value: `\`${targetUid}\``,                 inline: false },
      { name: "🤖 Nom des bots", value: botName,                            inline: true },
      { name: "🔢 Nombre",       value: `${botCount}`,                      inline: true },
      { name: "📡 Serveur",      value: `\`${host}:${MOBILE_PORT}\``,       inline: false },
      { name: "📊 Slots libres", value: `${slotsFree} / ${MAX_SESSIONS}`,   inline: true },
    )
    .setFooter({ text: "Utilise /stopsession pour arrêter tes bots." })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
  logger.info({ userId: i.user.id, host, botCount }, "Mobile tracker session started");
}

// ─── /stopsession ─────────────────────────────────────────────────────────

async function handleStopSession(i: ChatInputCommandInteraction): Promise<void> {
  const session = activeSessions.get(i.user.id);
  if (!session) {
    await i.reply({ content: "⚠️ Tu n'as pas de session active à arrêter." });
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
      `🛑 **Session arrêtée.**\n` +
      `Tes bots ont quitté **${session.host}**.\n` +
      `📊 Slots disponibles : **${slotsFree} / ${MAX_SESSIONS}**`,
  });
}

// ─── /boton ───────────────────────────────────────────────────────────────

async function handleBotOn(i: ChatInputCommandInteraction): Promise<void> {
  if (i.user.id !== OWNER_ID) {
    await i.reply({ content: "❌ Réservé à l'admin." });
    return;
  }
  botEnabled = true;
  await i.reply({ content: "✅ **Tracker bot activé.** Les utilisateurs peuvent utiliser `/tracker`." });
}

// ─── /botoff ──────────────────────────────────────────────────────────────

async function handleBotOff(i: ChatInputCommandInteraction): Promise<void> {
  if (i.user.id !== OWNER_ID) {
    await i.reply({ content: "❌ Réservé à l'admin." });
    return;
  }
  botEnabled = false;
  await i.reply({
    content:
      `🔴 **Tracker bot désactivé.**\n` +
      `Sessions actives en cours : **${activeSessions.size}**`,
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

  // Pre-load mobile bot manager
  try {
    await getMgr();
    logger.info("Tracker: mobile bot manager loaded.");
  } catch (err) {
    logger.error({ err }, "Tracker: failed to load mobile bot manager");
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
        await interaction.reply({ content: "❌ Erreur inattendue. Réessaie !" });
      }
    }
  });

  client.on(Events.Error, (err) => logger.error({ err }, "Tracker bot: client error"));

  client.login(token).catch((err) =>
    logger.error({ err }, "Tracker bot: login failed"),
  );
}
