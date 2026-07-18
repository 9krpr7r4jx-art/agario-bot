import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../lib/logger";

// ─── State ────────────────────────────────────────────────────────────────────

let botEnabled = false;

// ── Future: paid mode ─────────────────────────────────────────────────────────
// const paidUsers = new Set<string>();
// let paidModeEnabled = false;

// ─── Owner check ──────────────────────────────────────────────────────────────

function isOwner(userId: string): boolean {
  const ownerId = process.env["SKIN_BOT_OWNER_ID"];
  return !!ownerId && userId === ownerId;
}

// ─── PNG validation ───────────────────────────────────────────────────────────

const MAX_BYTES = 30 * 1024; // 30 KB
const REQUIRED_DIM = 512;

interface ValidationResult {
  ok: boolean;
  error?: string;
}

async function validateSkin(
  url: string,
  filename: string,
  filesize: number,
): Promise<ValidationResult> {
  // 1. Must be .png
  if (!filename.toLowerCase().endsWith(".png")) {
    return { ok: false, error: "❌ The skin must be a **PNG** file (`.png`)." };
  }

  // 2. Must be ≤ 30 KB
  if (filesize > MAX_BYTES) {
    const kb = (filesize / 1024).toFixed(1);
    return {
      ok: false,
      error: `❌ Your file is **${kb} KB** — the limit is **30 KB**.`,
    };
  }

  // 3. Read first 24 bytes to verify PNG magic + dimensions from IHDR
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-29" } });
    const buf = Buffer.from(await res.arrayBuffer());

    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    if (
      buf[0] !== 0x89 || buf[1] !== 0x50 ||
      buf[2] !== 0x4e || buf[3] !== 0x47
    ) {
      return { ok: false, error: "❌ Invalid file — not a real PNG." };
    }

    // IHDR: bytes 16–19 = width, 20–23 = height (big-endian uint32)
    const width  = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);

    if (width !== REQUIRED_DIM || height !== REQUIRED_DIM) {
      return {
        ok: false,
        error: `❌ Your skin is **${width}×${height} px** — it must be exactly **512×512 px**.`,
      };
    }
  } catch (err) {
    logger.warn({ err }, "Failed to read PNG header");
    return { ok: false, error: "❌ Could not read your image. Try again." };
  }

  return { ok: true };
}

// ─── Apply skin to Agario account ─────────────────────────────────────────────
//
// TODO: Replace this stub with your real Agario API call once you have the
//       endpoint. The UID + validated skin URL are ready to use.
//
// Example:
//   const res = await fetch("https://your-agario-api/skins/apply", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${process.env.AGARIO_API_KEY}` },
//     body: JSON.stringify({ uid, skinUrl }),
//   });
//   return { success: res.ok, error: res.ok ? undefined : await res.text() };

async function applySkinToAccount(
  uid: string,
  skinUrl: string,
): Promise<{ success: boolean; error?: string }> {
  logger.info({ uid, skinUrl }, "Skin validated — ready to apply (API pending)");
  // Return success once the API is wired
  return { success: true };
}

// ─── Command: /customskin ─────────────────────────────────────────────────────

async function handleCustomSkin(i: ChatInputCommandInteraction): Promise<void> {
  if (!botEnabled) {
    await i.reply({
      content: "Agar.io custom skin not active yet please wait until activation",
    });
    return;
  }

  // Defer so we have time to download + validate
  await i.deferReply();

  const uid        = i.options.getString("uid", true).trim();
  const attachment = i.options.getAttachment("skin", true);

  const result = await validateSkin(attachment.url, attachment.name, attachment.size);

  if (!result.ok) {
    await i.editReply({
      content:
        `${result.error}\n\n` +
        `📋 **Requirements:**\n` +
        `• Format : **PNG**\n` +
        `• Dimensions : **512 × 512 px**\n` +
        `• File size : **≤ 30 KB**`,
    });
    return;
  }

  const apply = await applySkinToAccount(uid, attachment.url);

  if (!apply.success) {
    await i.editReply({
      content: `⚠️ Skin validated but could not be applied to account \`${uid}\`. Please contact an admin.`,
    });
    return;
  }

  await i.editReply({
    content:
      `✅ **Custom skin applied!**\n\n` +
      `🆔 UID : \`${uid}\`\n` +
      `🖼️ Your **512×512** skin has been set on your Agario account.\n` +
      `It may take a few minutes to appear in-game.`,
  });
}

// ─── Command: /boton ──────────────────────────────────────────────────────────

async function handleBotOn(i: ChatInputCommandInteraction): Promise<void> {
  if (!isOwner(i.user.id)) {
    await i.reply({ content: "❌ Owner only." });
    return;
  }
  botEnabled = true;
  await i.reply({
    content: "✅ **Custom Skin bot is now ON.** Players can submit skins.",
  });
}

// ─── Command: /botoff ─────────────────────────────────────────────────────────

async function handleBotOff(i: ChatInputCommandInteraction): Promise<void> {
  if (!isOwner(i.user.id)) {
    await i.reply({ content: "❌ Owner only." });
    return;
  }
  botEnabled = false;
  await i.reply({
    content: "🔴 **Custom Skin bot is now OFF.** Users will be told to wait.",
  });
}

// ─── Slash command definitions ────────────────────────────────────────────────

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("customskin")
    .setDescription("Apply a custom skin to your Agario account")
    .addStringOption((o) =>
      o.setName("uid").setDescription("Your Agario account UID").setRequired(true),
    )
    .addAttachmentOption((o) =>
      o
        .setName("skin")
        .setDescription("Skin image — PNG, exactly 512×512 px, max 30 KB")
        .setRequired(true),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("boton")
    .setDescription("[Owner] Enable the custom skin bot")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("botoff")
    .setDescription("[Owner] Disable the custom skin bot")
    .toJSON(),
];

async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: COMMANDS });
    logger.info("Skin bot: slash commands registered globally.");
  } catch (err) {
    logger.error({ err }, "Skin bot: failed to register slash commands");
  }
}

// ─── Bot startup ──────────────────────────────────────────────────────────────

export async function startSkinBot(): Promise<void> {
  const token    = process.env["SKIN_BOT_TOKEN"];
  const clientId = process.env["SKIN_BOT_CLIENT_ID"];

  if (!token || !clientId) {
    logger.warn("SKIN_BOT_TOKEN or SKIN_BOT_CLIENT_ID missing — skin bot will not start.");
    return;
  }

  await registerCommands(token, clientId);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    logger.info({ tag: c.user.tag }, "Skin bot is online");
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      switch (interaction.commandName) {
        case "customskin": await handleCustomSkin(interaction); break;
        case "boton":      await handleBotOn(interaction);      break;
        case "botoff":     await handleBotOff(interaction);     break;
      }
    } catch (err) {
      logger.error({ err }, "Skin bot: unhandled interaction error");
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Something went wrong. Try again!" });
      }
    }
  });

  client.on(Events.Error, (err) => logger.error({ err }, "Skin bot: client error"));

  client.login(token).catch((err) =>
    logger.error({ err }, "Skin bot: failed to login"),
  );
}
