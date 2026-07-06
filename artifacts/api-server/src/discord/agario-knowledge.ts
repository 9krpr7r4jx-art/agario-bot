/**
 * Comprehensive Agario & Agario Mobile knowledge base.
 * Each entry has keywords (for matching) and an answer.
 */

export interface KnowledgeEntry {
  keywords: string[];
  answer: string;
}

export const AGARIO_KNOWLEDGE: KnowledgeEntry[] = [
  // ── SPLIT FEED / FEED SPLIT ──────────────────────────────────────────────
  {
    keywords: ["split feed", "feed split", "splitfeed", "feedsplit"],
    answer:
      "**Split Feed** (also called Feed Split): You split your cell toward an ally who then feeds (ejects mass) back into you. This lets you gain mass quickly as a team. The ally shoots mass into your split halves so you merge back bigger. It's a core teaming technique.",
  },
  {
    keywords: ["trick split", "trick", "instant split"],
    answer:
      "**Trick Split**: Press W (feed/eject) and Space (split) at the same time in very quick succession. The ejected mass boosts your split cell further than a normal split, letting you cover more distance and catch enemies off guard. Timing is key — practice the W → Space sequence rapidly.",
  },
  {
    keywords: ["cannon", "mass cannon", "feed cannon"],
    answer:
      "**Cannon**: When several teammates feed (eject mass) into one player simultaneously, that player uses the mass to launch a long-range split at an enemy. The combined mass allows the split to travel much farther than normal. It requires coordination: all feeders aim at the same spot at the same time.",
  },
  {
    keywords: ["multi split", "multisplit", "16 split", "max split"],
    answer:
      "**Multi Split**: Pressing Space multiple times in rapid succession splits your cell into up to 16 pieces. With more pieces, you cover a huge area and can engulf smaller cells. The downside is you're very vulnerable while split — merge time increases with each split.",
  },
  {
    keywords: ["double split", "2x split"],
    answer:
      "**Double Split**: Pressing Space twice quickly. You split into 4 cells total (from 1). Used to quickly reach a target that is slightly out of normal split range. Faster than multi-split and less risky.",
  },
  {
    keywords: ["merge", "merging", "merge time", "how long to merge"],
    answer:
      "**Merging**: Your split cells merge back together over time. The merge timer depends on your mass — bigger cells take longer to merge. A cell needs at least 30 seconds to begin merging (at base mass). The bigger you are, the longer it takes. Tip: stop splitting if you want to merge faster.",
  },

  // ── VIRUSES ───────────────────────────────────────────────────────────────
  {
    keywords: ["virus", "virus split", "pop", "popping", "green circle"],
    answer:
      "**Viruses** (green spiky circles): If you eat a virus while bigger than it (~133 mass minimum), you explode into many pieces — up to 16. Enemies can use viruses to pop you. You can also **shoot a virus** by feeding it (press W) 7 times — it splits the virus and launches a new one toward your cursor, which you can use to pop enemies.",
  },
  {
    keywords: ["feed virus", "shoot virus", "split virus", "virus send"],
    answer:
      "**Shooting a Virus**: Feed a virus 7 times (press W 7 times while pointing at it). On the 7th feed, the virus splits and a new virus flies toward your cursor. You can aim it at a large enemy to pop them. The virus travels in the direction you're facing.",
  },
  {
    keywords: ["avoid virus", "dodge virus", "virus defense"],
    answer:
      "**Avoiding Viruses**: Stay small enough not to absorb viruses (under ~133 mass). If you're large, avoid touching viruses. If an enemy is shooting viruses at you, split into 2–4 pieces before hitting the virus — this reduces how many pieces you explode into. You can also use viruses as a shield since smaller enemies can't eat them.",
  },

  // ── DNA ───────────────────────────────────────────────────────────────────
  {
    keywords: ["dna", "dna currency", "what is dna", "earn dna", "get dna"],
    answer:
      "**DNA** is the premium currency in **Agario Mobile**. You earn DNA by:\n• Playing games and leveling up\n• Completing daily missions\n• Watching ads\n• Buying with real money\n• Opening mystery boxes sometimes reward DNA\nDNA is used to unlock skins, themes, and other cosmetics in the shop.",
  },
  {
    keywords: ["spend dna", "dna shop", "dna buy", "what to buy with dna"],
    answer:
      "**Spending DNA** in Agario Mobile: Go to the Shop → use DNA to buy exclusive skins, skin themes, and cosmetic packs. Some rare skins cost 400–900 DNA. Event skins are often limited time. Save DNA for event exclusives — they don't come back often.",
  },

  // ── SKINS ─────────────────────────────────────────────────────────────────
  {
    keywords: ["skin", "skins", "custom skin", "how to get skins", "unlock skin"],
    answer:
      "**Skins in Agario**: \n• **PC (agar.io)**: Type a name matching a known skin (e.g. 'Poland', 'Facebook', 'Trump') or use custom skin URLs in some mods. Official skins are name-based.\n• **Agario Mobile**: Unlock skins in the Shop using DNA or real money. You can also get skins from mystery boxes and events. Equip them from your profile.",
  },
  {
    keywords: ["free skin", "free skins", "how to get free skins"],
    answer:
      "**Free Skins**: On Agario Mobile, watch ads daily to earn DNA for free, complete missions, and participate in events — events often give free limited skins. On PC agar.io, many flag/country skins are free just by typing the country name.",
  },

  // ── GAME MODES ────────────────────────────────────────────────────────────
  {
    keywords: ["game mode", "modes", "ffa", "battle royale", "teams mode", "experimental"],
    answer:
      "**Agario Game Modes**:\n• **FFA (Free For All)**: Everyone against everyone. Most popular mode.\n• **Teams**: Split into colored teams (red/green/blue). Work with your team.\n• **Experimental**: Tests new mechanics, sometimes unusual rules.\n• **Party**: Create a private room with friends using a share link.\n• **Battle Royale** (Mobile): The map shrinks over time — last player alive wins.",
  },
  {
    keywords: ["party mode", "private server", "play with friends", "party link"],
    answer:
      "**Party Mode**: On agar.io, click 'Party Mode' and share the link with friends. You all spawn in the same server. Great for clan practice. On Mobile, use the 'Create Party' button in the main menu.",
  },

  // ── AGARIO MOBILE SPECIFIC ────────────────────────────────────────────────
  {
    keywords: ["agario mobile", "mobile version", "ios agario", "android agario"],
    answer:
      "**Agario Mobile** is the official iOS/Android version. Differences from PC:\n• Virtual joystick controls (or tap to move)\n• DNA currency system\n• Battle Royale mode exclusive to mobile\n• Mystery boxes\n• More frequent events & seasonal skins\n• Slightly different physics/split behavior\n• Boosts (speed boost, mass boost) available",
  },
  {
    keywords: ["boost", "speed boost", "mass boost", "mobile boost"],
    answer:
      "**Boosts in Agario Mobile**: You can activate a **Speed Boost** (zooms your cell forward temporarily) or **Mass Boost** (gives you extra mass instantly). Boosts are earned through gameplay, missions, or purchased. Use speed boost to escape or chase; use mass boost to become large enough to eat an enemy.",
  },
  {
    keywords: ["mystery box", "box", "crate", "mystery crate"],
    answer:
      "**Mystery Boxes** in Agario Mobile: Earn them by playing matches or leveling up. Open them to receive random skins, DNA, or other rewards. Higher rarity boxes give better skins. Save your boxes for events when exclusive skins are in the pool.",
  },
  {
    keywords: ["level up", "xp", "experience", "level"],
    answer:
      "**Leveling Up** in Agario Mobile: You gain XP by eating cells, surviving longer, and completing missions. Higher levels unlock new rewards, mystery boxes, and titles. Your level badge is displayed on your profile.",
  },

  // ── CONTROLS ─────────────────────────────────────────────────────────────
  {
    keywords: ["controls", "how to play", "keys", "keybinds", "split key", "feed key"],
    answer:
      "**Agario Controls (PC)**:\n• **Move**: Mouse\n• **Split**: Space bar (splits your cell in two, toward cursor)\n• **Feed/Eject**: W key (shoots a small mass pellet toward cursor)\n• **Double-click**: Split quickly\n\n**Agario Mobile**:\n• **Move**: Drag/joystick or tap to move\n• **Split**: Tap the Split button\n• **Feed**: Tap the Feed button\n• **Boost**: Tap the Boost button",
  },

  // ── STRATEGIES ────────────────────────────────────────────────────────────
  {
    keywords: ["strategy", "strategies", "tips", "how to get big", "how to win", "pro tips"],
    answer:
      "**Agario Tips & Strategies**:\n1. **Hug corners** — edges and corners are safer; players can't surround you fully.\n2. **Use viruses** — hide near viruses when small; enemies can't eat you next to them.\n3. **Don't split recklessly** — only split when you're sure you'll eat someone.\n4. **Feed to allies** — build a team in FFA for safety and mass.\n5. **Avoid big players** — steer clear until you're large enough to fight back.\n6. **Recombine before fighting** — merge all pieces before engaging a large enemy.\n7. **Eat pellets when small** — build mass from the map pellets early game.",
  },
  {
    keywords: ["teaming", "team", "clan", "ally", "alliance"],
    answer:
      "**Teaming in Agario**: Working with other players in FFA mode. Common teamwork tactics:\n• **Feed allies**: Press W to give mass to teammates\n• **Split feed**: Coordinate split feeds for fast mass gain\n• **Protect each other**: Block enemies from reaching your teammate\n• **Cannon**: Mass up a teammate to launch them at an enemy\nTeaming is allowed in FFA but some consider it unfair. In Teams mode, it's the whole point!",
  },
  {
    keywords: ["solo", "play solo", "solo strategy", "no team"],
    answer:
      "**Solo Strategy (No Teaming)**:\n1. Stay near viruses for protection when small.\n2. Use trick splits to catch unsuspecting players.\n3. Shoot viruses into large split enemies.\n4. Always stay near the edge — harder to surround.\n5. Feed to lure small greedy cells, then split-eat them.\n6. Keep your mass in 2 pieces — more flexible than staying whole.",
  },

  // ── GLITCHES ─────────────────────────────────────────────────────────────
  {
    keywords: ["glitch", "glitches", "bug", "bugs", "exploit"],
    answer:
      "**Known Agario Glitches**:\n• **Ghost cell**: Rare glitch where a piece of your cell becomes invisible but still exists\n• **Freeze glitch**: Cell stops moving temporarily — usually a lag issue\n• **Mass loss glitch**: Cells lose mass faster than normal — usually server-side\n• **Skin not loading**: Refresh the page or restart the app\n• **Split not registering**: Server lag — keep pressing Space\nMost glitches are caused by server lag or connection issues.",
  },

  // ── MASS / PHYSICS ────────────────────────────────────────────────────────
  {
    keywords: ["mass", "how much mass", "lose mass", "mass decay", "mass loss"],
    answer:
      "**Mass in Agario**: Your cell constantly loses a small % of mass over time (mass decay). The bigger you are, the faster you lose mass. To grow: eat pellets (1 mass each), eat other cells, or receive fed mass. A cell needs to be **10% larger** than another cell to eat it.",
  },
  {
    keywords: ["eat", "who can eat who", "size to eat", "minimum size"],
    answer:
      "**Eating Rules**: You need to be at least **10% larger** (1.1x) than another cell to eat it. So if an enemy has 100 mass, you need at least 110 mass. After splitting, each half has half your mass — be careful you're still large enough to eat.",
  },
  {
    keywords: ["pellet", "food", "map food", "colored pellets", "agarpellet"],
    answer:
      "**Pellets**: The colored dots scattered across the map. Each gives 1 mass. They respawn over time. When starting out, eat as many pellets as possible to gain initial mass before risking fighting other players.",
  },

  // ── SERVER / REGIONS ──────────────────────────────────────────────────────
  {
    keywords: ["server", "region", "lag", "ping", "server list", "which server"],
    answer:
      "**Agario Servers**: agar.io has servers in multiple regions (US, EU, Asia, etc.). The game auto-selects the closest server. High ping = lag. Tips:\n• Use a VPN to try different regions if your region is overcrowded\n• Play at off-peak hours for less lag\n• On Mobile, check your WiFi — cellular can cause more lag",
  },
  {
    keywords: ["private server", "custom server", "mod", "modded server"],
    answer:
      "**Private/Modded Servers**: Third-party private servers like Agar.pro, Ogar (open source server), and others offer custom game modes, bots, and different rules. These are unofficial. On PC, search for 'Agario private server' or use browser extensions like Agario mods.",
  },

  // ── BOTS ──────────────────────────────────────────────────────────────────
  {
    keywords: ["bots", "bot", "cell bots", "agario bots", "ai bots"],
    answer:
      "**Agario Bots**: Automated players controlled by scripts/AI. In official servers, bots are not allowed and Miniclip bans them. However, private servers often include bots to fill lobbies. Bots typically move in straight lines and feed predictably — easy to spot and eat.",
  },

  // ── ASHOT / COMMUNITY ────────────────────────────────────────────────────
  {
    keywords: ["ashot", "who is ashot", "ashot discord"],
    answer:
      "**Ashot** is a well-known member of this Agario community who runs and manages bots for the server. Ask him directly for updates on his projects!",
  },

  // ── LEADERBOARD ──────────────────────────────────────────────────────────
  {
    keywords: ["leaderboard", "top players", "rank", "highest score", "number one"],
    answer:
      "**Leaderboard**: The top 10 players by mass are shown on the right side of the screen. Getting to #1 requires a lot of mass — usually 50,000+ on busy servers. Teaming is the fastest way to reach the top. Solo players use aggressive split strategies.",
  },

  // ── CLANS ─────────────────────────────────────────────────────────────────
  {
    keywords: ["clan", "clans", "join clan", "create clan", "clan tag"],
    answer:
      "**Clans in Agario**: Groups of players who team together regularly. Clans often have a tag in their name (e.g. [TAG] PlayerName). To join a clan: look for recruitment posts in Discord servers, Reddit (r/agario), or in-game. Clan members recognize each other by their name tag and protect/feed each other.",
  },

  // ── TRICKS & MECHANICS ───────────────────────────────────────────────────
  {
    keywords: ["dodge split", "run away", "escape", "how to escape"],
    answer:
      "**Escaping / Dodging**:\n1. **Split away**: Split toward empty space to gain speed (split cells move faster initially)\n2. **Use viruses**: Run through a virus — if you're small enough not to pop, enemies might not follow\n3. **Go to a corner**: Corners limit how enemies can approach\n4. **Feed away from enemy**: Eject mass (W) away from the enemy to slightly speed yourself up... careful though, you lose mass\n5. **Cell tower**: Get behind a large ally",
  },
  {
    keywords: ["speed", "how fast", "cell speed", "movement speed", "smaller faster"],
    answer:
      "**Cell Speed**: Smaller cells move faster than larger cells. A tiny cell moves much faster than a massive one. This is why you can escape big players by staying small — they can't catch you. After splitting, cells get a temporary speed boost in the split direction.",
  },
  {
    keywords: ["freeze", "stop", "how to stop moving"],
    answer:
      "**Stopping**: You can't fully stop in Agario — your cell always moves toward your cursor. To stay still, move your cursor to the exact center of your cell. On mobile, release the joystick to slow down but you'll still drift slightly.",
  },
  {
    keywords: ["zoom", "zoom out", "see more", "bigger view"],
    answer:
      "**Zoom**: On PC, use the scroll wheel to zoom in/out. Zooming out lets you see more of the map — useful for spotting large enemies and planning moves. On mobile, pinch to zoom. Some browser extensions unlock further zoom than the default allows.",
  },

  // ── HOW TO GET GOOD ───────────────────────────────────────────────────────
  {
    keywords: ["get better", "improve", "practice", "how to get good", "noob", "beginner"],
    answer:
      "**How to Improve at Agario**:\n1. Learn **trick splits** — the W+Space combo is essential\n2. Practice **virus shooting** — 7 feeds to launch a virus at enemies\n3. **Watch top players** on YouTube/Twitch to learn macro play\n4. Play **FFA** to practice fighting; play **Teams** to practice coordination\n5. Learn **map awareness** — always know where large players are\n6. Be patient — don't rush into fights when small",
  },

  // ── GENERAL GAME INFO ────────────────────────────────────────────────────
  {
    keywords: ["what is agario", "agar.io", "agario game", "how to play agario"],
    answer:
      "**Agario (agar.io)** is a multiplayer browser/mobile game where you control a circular cell on a petri dish map. You eat smaller cells and colored pellets to grow, and avoid being eaten by bigger cells. The goal is to become the largest cell on the server. It was created by Matheus Valadares in 2015 and is now owned by Miniclip.",
  },
  {
    keywords: ["when did agario come out", "agario release", "agario history", "who made agario"],
    answer:
      "**Agario History**: Created by Brazilian developer **Matheus Valadares** and released in **April 2015**. It went viral almost immediately. Miniclip acquired it in 2015. The mobile version launched in 2015 as well. It remains one of the most-played .io games ever made.",
  },
];

// ── Topic detection keywords ──────────────────────────────────────────────────
// If the message contains ANY of these, it's considered Agario-related.
export const AGARIO_TOPIC_KEYWORDS = [
  "agario", "agar.io", "agar io", "cell", "split", "feed", "virus",
  "mass", "pellet", "merge", "eat", "skin", "dna", "miniclip",
  "trick", "cannon", "dodge", "escape", "leaderboard", "clan", "team",
  "server", "ffa", "bot", "bots", "agarpellet", "mobile", "boost",
  "mystery box", "level", "xp", "rank", "blob", "zoom", "eject", "w key",
  "spacebar", "glitch", "lag", "ping", "private server", "mod",
];

/**
 * Checks if a message is related to Agario based on keywords.
 */
export function isAgarioRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return AGARIO_TOPIC_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Finds the best matching knowledge entry for a given question.
 * Returns null if no good match found.
 */
export function findAnswer(text: string): string | null {
  const lower = text.toLowerCase();

  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of AGARIO_KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        // Longer keyword matches score higher
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Require a minimum score to avoid weak matches
  if (bestScore >= 4 && bestEntry) {
    return bestEntry.answer;
  }

  return null;
}
