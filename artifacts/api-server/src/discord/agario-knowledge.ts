/**
 * Ultra-comprehensive Agario & Agario Mobile knowledge base.
 */

export interface KnowledgeEntry {
  keywords: string[];
  answer: string;
}

export const AGARIO_KNOWLEDGE: KnowledgeEntry[] = [

  // ═══════════════════════════════════════════════════════
  //  CUSTOM SKINS
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["custom skin", "customskin", "how to make custom skin", "create skin", "own skin", "personal skin", "make skin"],
    answer:
      "**Custom Skins in Agario Mobile** 🎨\n\nYou can create your own custom skin:\n1. Go to your **Profile** in the main menu\n2. Tap **Edit Cell** or the pencil icon\n3. Choose **Custom Skin**\n4. You can draw directly on the cell using the built-in editor\n5. Pick colors, patterns, and designs\n6. Save and equip it\n\nAlternatively, some versions allow importing an image from your phone gallery as a skin. The image must be square and ideally 512×512px. Custom skins are visible to you — other players may see a default skin unless they also have custom skin support enabled.\n\n💡 Tip: Keep it simple — complex designs look better at small cell sizes.",
  },
  {
    keywords: ["import skin", "upload skin", "image skin", "photo skin", "gallery skin"],
    answer:
      "**Importing a Custom Skin Image** 📲\n\nIn Agario Mobile:\n1. Go to **Profile → Edit Cell → Custom Skin**\n2. Tap the **Gallery / Import** option\n3. Select a square image from your phone (PNG works best)\n4. Crop and confirm\n5. Your cell will display that image\n\nBest practices:\n• Use 512×512 or 256×256 pixels\n• PNG with transparent background looks cleanest\n• Keep the design centered — the edges of the cell curve away\n• Bright colors are more visible during gameplay",
  },
  {
    keywords: ["skin pack", "skin bundle", "skin collection", "skin sets"],
    answer:
      "**Skin Packs in Agario Mobile** 🎁\n\nSkin packs are bundles sold in the Shop that include multiple related skins at a discounted total price compared to buying individually. They often appear during events (Halloween, Christmas, etc.).\n\nTypes of packs:\n• **Seasonal Packs** — holiday-themed skins bundled together\n• **Clan Packs** — skins representing popular clans or groups\n• **Starter Packs** — cheap packs for new players\n• **Premium Packs** — rare skins, higher DNA cost\n\nPacks rotate regularly — check the Shop daily for new bundles.",
  },
  {
    keywords: ["best skins", "rarest skins", "rare skin", "legendary skin", "epic skin"],
    answer:
      "**Rarest & Best Skins in Agario Mobile** ⭐\n\nSkin rarities (from common to rarest):\n1. **Common** — basic designs, easily obtained\n2. **Rare** — more detailed, DNA shop or mystery boxes\n3. **Epic** — limited releases, special events\n4. **Legendary** — extremely rare, often seasonal exclusives\n\nMost sought-after skins include:\n• **Event exclusives** (Halloween, Christmas editions) — come back rarely or never\n• **Collaboration skins** — with brands or games\n• **Clan skins** — representing famous Agario clans\n• **Animated skins** — skins with moving effects (premium)\n\nLegendary skins can cost 800–1500 DNA or only come from mystery boxes.",
  },
  {
    keywords: ["animated skin", "animation skin", "moving skin", "effect skin"],
    answer:
      "**Animated Skins** ✨\n\nSome premium skins in Agario Mobile have animations — glowing effects, rotating patterns, or pulsing colors. These are usually **Legendary** or **Epic** rarity.\n\nHow to get them:\n• High-tier Mystery Boxes\n• Special event shop (limited time)\n• Premium DNA bundles\n\nAnimated skins have special visual effects that make your cell stand out. They cost more DNA or real money but are highly sought after.",
  },
  {
    keywords: ["how to unlock skin", "unlock skins", "get all skins", "unlock all"],
    answer:
      "**How to Unlock Skins in Agario Mobile** 🔓\n\nWays to get skins:\n1. **Buy with DNA** — most skins are in the DNA shop\n2. **Mystery Boxes** — random skin drops (duplicate protection varies)\n3. **Events** — complete event missions for exclusive skins\n4. **Daily Login Rewards** — sometimes include skins\n5. **Level Up Rewards** — certain levels reward skins\n6. **Battle Pass** (if available) — tiered skin rewards\n7. **Real Money** — direct purchase in the store\n8. **Clan Rewards** — some clans offer exclusive skins to members\n\n💡 Best free method: Daily missions + watch ads to stack DNA, then buy during sales.",
  },
  {
    keywords: ["equip skin", "change skin", "switch skin", "use skin", "apply skin"],
    answer:
      "**Equipping a Skin in Agario Mobile** ✅\n\n1. Tap your **Profile** icon (top left in main menu)\n2. Tap **Edit Cell** or the cell preview\n3. Browse your skin collection\n4. Tap a skin to preview it\n5. Tap **Equip** or **Select** to apply it\n6. The skin is now active — it shows in all game modes\n\nYou can also quickly change skins from the pre-game lobby screen before entering a match.",
  },

  // ═══════════════════════════════════════════════════════
  //  DNA CURRENCY (COMPREHENSIVE)
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["dna", "dna currency", "what is dna", "dna mobile", "dna points"],
    answer:
      "**DNA — Agario Mobile Currency** 🧬\n\nDNA is the premium currency in Agario Mobile used to buy skins and cosmetics.\n\n**How to earn DNA FREE:**\n• Watch ads (usually 20–50 DNA per ad)\n• Complete daily missions\n• Log in daily for streak rewards\n• Level up milestones\n• Finishing top in matches (small amounts)\n• Opening mystery boxes (sometimes includes DNA)\n• Clan events/challenges\n\n**How to earn DNA FAST (paid):**\n• In-app purchase in the Shop\n• Bundle deals (more DNA per dollar)\n\n**DNA costs roughly:**\n• Common skin: 50–150 DNA\n• Rare skin: 200–400 DNA\n• Epic skin: 400–700 DNA\n• Legendary skin: 700–1500 DNA",
  },
  {
    keywords: ["free dna", "dna without money", "dna hack", "dna cheat", "unlimited dna"],
    answer:
      "**Getting Free DNA in Agario Mobile** 🆓\n\n✅ Legitimate free methods:\n1. **Watch ads daily** — the fastest free method (5–10 ads/day = 100–300 DNA)\n2. **Daily missions** — complete all 3 missions for DNA rewards\n3. **Daily login streak** — 7-day streak gives bonus DNA\n4. **Level up** — every few levels give DNA\n5. **Events** — event missions often give 50–200 DNA as prizes\n6. **Mystery boxes** — some contain DNA\n\n❌ There are NO legitimate hacks or cheats for unlimited DNA. Apps/sites claiming to give free DNA are scams that steal your account. Never enter your Miniclip login on third-party sites.",
  },

  // ═══════════════════════════════════════════════════════
  //  SPLIT MECHANICS (VERY DETAILED)
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["trick split", "tricksplit", "trick", "instant split", "fast split"],
    answer:
      "**Trick Split** ⚡\n\n**What it is:** A split that goes further than a normal split by combining ejected mass with the split momentum.\n\n**How to do it on Mobile:**\n1. Tap the **Feed button (W)** and the **Split button** almost simultaneously — Feed first, then Split within ~50ms\n2. The ejected mass pellet acts as extra momentum, launching your split cell further\n3. With practice, you can catch enemies that are just out of normal split range\n\n**Why it works:** The ejected mass pellet pushes the split cell slightly further, increasing the split range by ~20–30%.\n\n**Tips:**\n• Practice timing in Party Mode with a friend\n• Works best when you have enough mass (300+ recommended)\n• Use it to catch opponents who think they're safely out of range",
  },
  {
    keywords: ["split feed", "feed split", "splitfeed", "feedsplit", "team split"],
    answer:
      "**Split Feed / Feed Split** 🤝\n\n**What it is:** A team technique where one player splits toward an ally, and the ally feeds (ejects mass) into the split cells so they merge back bigger.\n\n**How to do it:**\n1. Player A splits toward Player B\n2. Player B rapidly feeds (taps W/Feed) mass into Player A's cells\n3. Player A's cells merge back with more mass than they started with\n4. Repeat to rapidly increase mass\n\n**Why it's powerful:** Each feed cycle adds net mass. With multiple allies feeding, one player can reach massive size quickly — perfect for dominating the leaderboard.\n\n**Advanced:** Chain split feeds — A feeds B, B feeds C, C feeds A — for triple mass gain.",
  },
  {
    keywords: ["cannon", "mass cannon", "feed cannon", "long range split", "rocket"],
    answer:
      "**Cannon** 🚀\n\n**What it is:** Multiple teammates feed one player until they're massive, then that player fires a long-range split at an enemy.\n\n**How to execute:**\n1. 2–5 teammates all feed (tap W/Feed) into one designated 'cannon' player simultaneously\n2. The cannon player's mass grows rapidly\n3. The cannon player splits at maximum size toward the enemy\n4. The enormous split cell travels further and faster, covering much more distance\n\n**Why it's devastating:** A cell with 50,000+ mass splits much further than a normal cell. The target often can't escape in time.\n\n**Counter:** Stay near viruses, or stay small so the cannon player can't eat you.",
  },
  {
    keywords: ["multi split", "multisplit", "16 split", "max split", "spam split"],
    answer:
      "**Multi Split (Spam Split)** 💥\n\n**What it is:** Splitting multiple times in rapid succession to divide into up to 16 cells.\n\n**How to do it on Mobile:** Rapidly tap the Split button multiple times in the same direction.\n\n**Split limits:**\n• 1 split → 2 cells\n• 2 splits → 4 cells\n• 3 splits → 8 cells\n• 4 splits → 16 cells (maximum)\n\n**Uses:**\n• Catch a group of small cells quickly\n• Cover a wide area of the map\n• Escape by splitting in multiple directions\n\n**Danger:** When split into 16 cells, you're very vulnerable. Enemies can eat individual pieces. Merge before fighting anything large.",
  },
  {
    keywords: ["double split", "2x split", "2 split"],
    answer:
      "**Double Split** ✌️\n\nSplitting twice quickly to go from 1 cell to 4 cells. Used to:\n• Catch enemies slightly out of normal split range\n• Get past a defensive virus barrier\n• Cover a small gap quickly\n\nOn Mobile: Tap Split twice rapidly. The second split happens while your first split cells are still moving apart, sending cells even further.",
  },
  {
    keywords: ["merge", "merging", "merge time", "how long merge", "cell merge", "recombine"],
    answer:
      "**Merging / Recombination** ⏱️\n\nAfter splitting, cells take time to merge back together.\n\n**Merge timer formula:**\n• Base time: ~30 seconds (for small cells)\n• Larger mass = longer merge time\n• A cell of 1000 mass might take 45–60 seconds\n• Enormous cells (10,000+) can take 90+ seconds\n\n**How to merge faster:**\n• Stop moving and let cells drift toward each other\n• Don't keep splitting — each new split resets the timer on new pieces\n\n**When NOT to merge:**\n• When being chased — stay split for speed boost\n• When hunting multiple small cells\n\n**Key rule:** Two cells only merge if they come from the same player AND the merge timer has expired.",
  },

  // ═══════════════════════════════════════════════════════
  //  VIRUSES (COMPREHENSIVE)
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["virus", "viruses", "green spiky", "pop", "explode", "virus split"],
    answer:
      "**Viruses** 🦠\n\nGreen spiky circles scattered across the map.\n\n**Key rules:**\n• If you're **larger than 133 mass** and touch a virus → you **explode** into up to 16 pieces\n• If you're **smaller than 133 mass** → you can safely hide behind/near viruses\n• Viruses cannot be eaten by cells smaller than them\n\n**Offensive use:**\n• Shoot a virus at a large enemy to pop them into pieces, then eat the small pieces\n• Combine with allies: one pops the enemy, teammates eat the fragments\n\n**Defensive use:**\n• Small cells can hide near viruses — large enemies won't chase you there\n• Use viruses as a wall between you and a chaser",
  },
  {
    keywords: ["shoot virus", "fire virus", "send virus", "virus attack", "feed virus 7", "7 times"],
    answer:
      "**Shooting a Virus** 🎯\n\n**How to shoot a virus (Mobile):**\n1. Aim your cell at the virus\n2. Tap the **Feed button (W) 7 times** while aimed at the virus\n3. On the 7th feed, the virus **splits** — a new virus launches toward your cursor\n4. Aim the launching virus at a large enemy to pop them\n\n**Tips:**\n• You need at least 133 mass to shoot a virus effectively\n• The launched virus travels in a straight line — aim ahead of a moving target\n• Coordinate with teammates: one shoots virus, others eat the exploded pieces\n• Multiple viruses can be chained if there are several nearby",
  },
  {
    keywords: ["virus pop defense", "avoid virus", "dodge virus", "anti virus", "virus counter"],
    answer:
      "**Defending Against Viruses** 🛡️\n\n**When someone shoots a virus at you:**\n1. **Split BEFORE the virus hits** → you split into fewer pieces (going from 2 pieces hit is better than 1)\n2. **Move to the edge** of the map — viruses travel in a line, you can dodge\n3. **Pre-split** into 4–8 pieces before the virus arrives — reduces the pop damage\n4. **Stay small enough** (under 133 mass) near the start of the game to not be affected\n\n**Prevention:**\n• Watch for players feeding nearby viruses (7 feeds = incoming virus)\n• Keep moving — a stationary large cell is easy to virus-pop",
  },

  // ═══════════════════════════════════════════════════════
  //  TEAMS
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["teams", "team mode", "team play", "how to team", "teaming", "play teams"],
    answer:
      "**Teams Mode in Agario Mobile** 🔵🔴🟢\n\n**How it works:**\n• Players are randomly assigned to a colored team (usually Red, Green, Blue)\n• Your team's combined mass determines who wins\n• You cannot eat teammates of the same color\n• Cooperate to dominate the map\n\n**Team tactics:**\n• **Feed allies** — press Feed (W) to give mass to struggling teammates\n• **Split feed** — coordinate split feeds to rapidly grow a single player\n• **Cannon** — mass up one player, they split at the enemy team\n• **Block enemies** — position your large cell to block enemy cells from eating small teammates\n• **Zone control** — spread team across the map to control territory\n\n**Note:** You can still get split by viruses even if teammates feed you, so communicate and be careful.",
  },
  {
    keywords: ["ffa", "free for all", "ffa mode", "everyone vs everyone", "solo mode"],
    answer:
      "**FFA (Free For All) Mode** ⚔️\n\nThe classic Agario mode — everyone fights everyone. No permanent allies.\n\n**FFA tips:**\n• **Early game:** Eat pellets, avoid everyone, grow slowly\n• **Mid game:** Target players around your size or smaller\n• **Late game:** Use split/virus tactics on the large players\n• **Teaming in FFA:** Some players informally team in FFA (feed each other). This is allowed but controversial\n• **Solo strategy:** Stay near edges/viruses, use trick splits to catch unsuspecting players\n\nFFA is the best mode to practice your individual skill.",
  },
  {
    keywords: ["battle royale", "agario battle royale", "br mode", "shrinking map", "last cell standing"],
    answer:
      "**Battle Royale Mode** (Agario Mobile Exclusive) 👑\n\nA Agario Mobile-exclusive mode where:\n• The map **shrinks over time** (a toxic zone closes in)\n• Players caught in the toxic zone slowly lose mass\n• Last cell(s) alive win\n• No teams — everyone for themselves\n\n**Strategy:**\n• **Stay near the center** as the map shrinks\n• **Be aggressive mid-game** when the zone forces everyone together\n• **Don't be too big** — you're a target and slower\n• **Split to escape** the toxic zone if caught\n• **Use viruses** to pop large opponents when zone forces close quarters",
  },
  {
    keywords: ["party mode", "party", "play with friends", "private room", "invite friends"],
    answer:
      "**Party Mode in Agario Mobile** 🎉\n\nPlay with your friends in a private room:\n1. Tap **Play → Party Mode**\n2. Create a room → get a **room code**\n3. Share the code with friends\n4. Friends tap **Join Party** and enter the code\n5. All players spawn in the same server\n\n**Great for:**\n• Practicing split feeds and cannons\n• Clan training\n• Private tournaments\n• Testing tricks and glitches safely\n\n💡 Party mode is the best environment to practice advanced techniques without pressure.",
  },

  // ═══════════════════════════════════════════════════════
  //  CLANS (COMPREHENSIVE)
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["clan", "clans", "what is a clan", "agario clan", "clan mobile"],
    answer:
      "**Clans in Agario Mobile** 🏆\n\nClans are organized groups of players who:\n• Team together regularly in matches\n• Share a **clan tag** in their name (e.g. `[TAG] PlayerName`)\n• Coordinate via Discord, WhatsApp, or in-game clan chat\n• Compete in clan wars against other clans\n• Share strategies and training\n\n**Clan hierarchy:**\n• **Leader** — creates and manages the clan\n• **Co-Leader / Officer** — helps manage, can invite/kick\n• **Member** — regular clan player\n• **Recruit / Trial** — new members being tested\n\n**Benefits of being in a clan:**\n• Organized teaming in FFA/Teams mode\n• Clan-exclusive events and rewards\n• Improve faster with experienced teammates\n• Exclusive clan skins (some clans)",
  },
  {
    keywords: ["join clan", "find clan", "clan recruitment", "how to join clan"],
    answer:
      "**How to Join a Clan** 🤝\n\n**Ways to find a clan:**\n1. **This Discord server** — check recruitment channels\n2. **Reddit** (r/agario) — active clan recruitment posts\n3. **In-game clan browser** — Agario Mobile has a built-in clan search\n4. **YouTube/TikTok** — popular Agario players often recruit via their channels\n\n**How to apply:**\n1. Find a clan that matches your skill level\n2. Meet their requirements (usually minimum level, activity, sometimes a skill test)\n3. Apply via in-game button or contact the leader on Discord\n4. Play a trial period (usually 1–2 weeks)\n5. Get accepted as a full member\n\n💡 Tip: Be active and show your skills during the trial — leaders are watching!",
  },
  {
    keywords: ["create clan", "start clan", "make clan", "clan leader", "found clan"],
    answer:
      "**Creating a Clan in Agario Mobile** ⚙️\n\n**Steps:**\n1. Tap the **Clan** button in the main menu\n2. Tap **Create Clan**\n3. Choose a **clan name** and **tag** (2–5 characters, shown before names)\n4. Set clan description and requirements\n5. Set to Public (anyone can apply) or Private (invite only)\n6. Pay the clan creation fee (DNA or coins)\n\n**Running a clan:**\n• Set **minimum level requirements** to filter casual players\n• Create a **Discord server** for communication\n• Hold **regular training sessions** in Party Mode\n• Promote active/skilled players to officer\n• Organize **clan wars** against rival clans\n• Create a **clan tag** that's short and memorable",
  },
  {
    keywords: ["clan war", "clan battle", "clan vs clan", "cvc", "clan competition"],
    answer:
      "**Clan Wars** ⚔️\n\nClans compete against each other in organized battles:\n\n**How clan wars work:**\n• Two clans agree on a time and game mode\n• They join the same server (Party Mode or public)\n• Score is tracked by mass accumulated, cells eaten, or leaderboard position\n• The clan with the highest score after the session wins\n\n**Clan war formats:**\n• **Mass competition** — who can reach highest total mass\n• **Elimination** — most enemies eaten\n• **Survival** — last clan member at top of leaderboard\n• **Capture the zone** — control the center of the map longest\n\n**Preparation:** Practice split feeds and cannons beforehand. Assign roles: feeders, tanks, flankers.",
  },
  {
    keywords: ["clan tag", "clan name", "tag agario", "clan prefix"],
    answer:
      "**Clan Tags** 🏷️\n\nClan tags are short prefixes or suffixes added to player names to identify clan membership.\n\n**Format:** `[TAG] PlayerName` or `PlayerName [TAG]`\n\n**Examples of famous clan tags:**\n• `[ELT]` — Elite\n• `[PRO]` — Professional teams\n• `[GOD]` — God-tier clans\n• Custom tags unique to each clan\n\n**Rules for tags:**\n• Usually 2–5 characters\n• No special symbols in some versions\n• Should be unique and easy to recognize\n• Must match the in-game clan registration\n\n💡 When you join a clan, you manually add the tag to your nickname in Profile settings.",
  },
  {
    keywords: ["famous clan", "best clan", "top clan", "well known clan", "popular clan"],
    answer:
      "**Famous Agario Clans** 🌟\n\nSome historically well-known clans in Agario:\n• **AOD** (Army of Darkness) — one of the oldest organized clans\n• **ELT** (Elite) — known for skilled players\n• **TOXIC** — aggressive, competitive team\n• **GODS** — high-skill FFA players\n• **Team Doge** — started as a meme, became competitive\n• **BG** (Baby Grabs) — popular in early Agario\n\n**Note:** The Agario clan scene evolves constantly — new clans rise and old ones dissolve. Check current active clans in this Discord or on Reddit r/agario for up-to-date info.",
  },

  // ═══════════════════════════════════════════════════════
  //  GLITCHES (COMPREHENSIVE)
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["glitch", "glitches", "bug", "bugs", "exploit", "glitch mobile"],
    answer:
      "**Agario Mobile Glitches & Bugs** 🐛\n\nKnown glitches in Agario Mobile:\n\n**Visual glitches:**\n• Skin not displaying (restart app fixes it)\n• Cell appears as wrong color in Teams mode\n• Leaderboard shows wrong mass\n\n**Gameplay glitches:**\n• **Ghost cell** — part of your cell goes invisible but still exists; can be eaten\n• **Mass freeze** — your mass stops updating on screen but you're still growing\n• **Split stuck** — a split cell freezes in place temporarily; usually recovers\n• **Merge loop** — cells keep trying to merge but fail (server desync)\n\n**Connection glitches:**\n• **Teleport** — your cell suddenly jumps position due to lag\n• **Rubber band** — cell keeps snapping back to previous position\n• **Clone cell** — two copies of your cell appear briefly\n\nMost glitches are caused by server lag or bad internet connection. Restart app or switch servers to fix.",
  },
  {
    keywords: ["wall glitch", "edge glitch", "corner glitch", "wall hack"],
    answer:
      "**Edge/Wall Glitch** 🗺️\n\nSometimes cells can partially clip through or get stuck at the map border:\n• Your cell can look like it's moving through the wall but is actually getting pushed back\n• Some players use corners strategically — it's not truly a glitch, just the boundary physics\n• If you get stuck at the edge: split toward the center to free yourself\n• In very rare cases, a cell can appear on the 'outside' of the map — reconnecting fixes this",
  },
  {
    keywords: ["infinite mass glitch", "mass hack", "mass glitch", "mass exploit"],
    answer:
      "**Mass Exploits** ⚠️\n\nThere are no legitimate infinite mass exploits in modern Agario Mobile — Miniclip patches them quickly. Anyone claiming to sell/share a 'mass hack' is scamming.\n\n**What LOOKS like a mass glitch but isn't:**\n• Large players who teamed effectively (split feed/cannon)\n• Players who've been in a server a long time without dying\n• Visual lag making someone appear bigger than they are\n\nIf you see someone with impossibly large mass, they likely used advanced teaming, not hacks.",
  },
  {
    keywords: ["skin glitch", "skin bug", "skin not showing", "skin disappeared", "skin broken"],
    answer:
      "**Skin Glitches** 🎨\n\nCommon skin issues in Agario Mobile:\n• **Skin not showing to others** — your skin shows to you but others see a blank cell. Cause: server sync issue. Fix: equip a different skin, then re-equip yours.\n• **Skin reset after match** — rare bug where skin resets to default. Fix: re-equip from profile.\n• **Skin appearing as wrong skin** — visual desync. Restart the app.\n• **Purchased skin not appearing** — check internet connection, try restarting. If still missing, contact Miniclip support.\n• **Custom skin not saving** — make sure you tap Save before exiting the editor",
  },

  // ═══════════════════════════════════════════════════════
  //  ADVANCED TRICKS & TECHNIQUES
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["lure", "bait", "lure trick", "bait trick", "fake feed"],
    answer:
      "**Lure / Bait Trick** 🎣\n\nA deceptive technique to attract greedy players:\n1. Act like you're a small, easy-to-eat cell\n2. Move slowly near an enemy\n3. When they commit to chasing/eating you, **quickly split** to eat them\n4. Works especially well when you're just slightly larger than your opponent\n\n**Advanced bait:** Feed (eject mass) near an enemy. They see the mass and move toward it greedily. While they're distracted eating the ejected mass, split to eat them.",
  },
  {
    keywords: ["teabag", "tea bag", "teabagging", "celebrate kill"],
    answer:
      "**Teabagging** 😄\n\nIn Agario, 'teabagging' means rapidly splitting and re-merging on top of a just-eaten enemy's spot as a taunt. It's done by spam-splitting on the location where you ate someone. Purely for fun/trolling — not a strategic move!",
  },
  {
    keywords: ["avoid split", "anti split", "dodge split", "split dodge", "escape split"],
    answer:
      "**Dodging Enemy Splits** 🏃\n\nHow to avoid being eaten by a split attack:\n1. **Zigzag movement** — unpredictable movement makes you harder to target\n2. **Go toward viruses** — most players won't split at you if you're near a virus\n3. **Split perpendicular** — if they split at you, split 90° to their direction to dodge\n4. **Be smaller** — the 10% mass rule means if they can barely eat you, their split may miss\n5. **Move toward them** — counterintuitively, moving toward a splitting enemy can make their split pass over you (the split travels forward, past you)",
  },
  {
    keywords: ["cell stacking", "stack cells", "cell tower", "tower", "stacking trick"],
    answer:
      "**Cell Stacking / Tower** 🏗️\n\nA teaming trick where multiple players overlap their cells on the same spot:\n• Stack your cell on top of a teammate's cell\n• From an enemy's perspective, you look like one big cell\n• When an enemy tries to eat the 'one big cell', they get surprised by the hidden cells\n• Used defensively: the outer cell protects the inner cells\n\nAlso called 'cell tower' when multiple small ally cells sit inside a large ally cell, feeding it.",
  },
  {
    keywords: ["spawn kill", "spawn protection", "respawn", "new spawn"],
    answer:
      "**Spawning & Spawn Protection** 🌱\n\nWhen you spawn (start or respawn after dying):\n• You start with a small amount of mass\n• You're immune to being eaten briefly (a few seconds of spawn protection)\n• After protection ends, large players can eat you\n\n**Spawn killing** — camping at spawn locations to eat newly spawned cells. This is frowned upon but not bannable.\n\n**Anti-spawn-kill tips:**\n• Move quickly away from spawn after appearing\n• Eat pellets rapidly to grow past the danger threshold\n• Head toward the edge of the map where large players are less common",
  },
  {
    keywords: ["freeze trick", "stop enemy", "cell freeze trick", "immobilize"],
    answer:
      "**Freeze Technique** ❄️\n\nWhen two large cells of similar size press against each other, they can temporarily slow each other's movement — effectively 'freezing' one in place.\n\n**How to use it:**\n• Have an ally position their large cell against an enemy's large cell\n• The enemy is slowed/pinned\n• A second ally splits to eat the frozen enemy\n\n**Counter:** Split away from the direction you're being pushed from.",
  },

  // ═══════════════════════════════════════════════════════
  //  GAME MECHANICS
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["mass decay", "lose mass", "mass loss", "mass decrease", "shrink"],
    answer:
      "**Mass Decay** 📉\n\nYour cell continuously loses a small % of mass over time:\n• Rate: approximately 1–2% per second (varies by server)\n• Bigger cells lose mass faster in absolute terms (but same % rate)\n• This means you must keep eating to maintain your size\n• Cells under ~20 mass don't decay (minimum threshold)\n\n**Strategy implication:** A very large cell that stops eating will slowly shrink. If you're large enough, you can 'outlast' an enemy by not giving them anything to eat while they decay.",
  },
  {
    keywords: ["eat rule", "who can eat who", "size requirement", "10 percent", "mass to eat"],
    answer:
      "**Eating Rules** 🍽️\n\n**Core rule:** You need to be **at least 10% larger** (1.1× the mass) to eat another cell.\n\n**Examples:**\n• Enemy has 100 mass → you need 110+ to eat them\n• Enemy has 500 mass → you need 550+ to eat them\n• Enemy has 10,000 mass → you need 11,000+ to eat them\n\n**Split eating:** When you split, each half has ~half your mass. Be careful — your split cell might not be big enough to eat the target!\n\n**Cell absorption:** When your cell overlaps more than 50% of a smaller cell, it gets absorbed instantly.",
  },
  {
    keywords: ["pellet", "food pellets", "dots", "map food", "colored dots", "pellet mass"],
    answer:
      "**Pellets / Food Dots** 🔵\n\nSmall colored circles scattered across the map:\n• Each pellet gives **1 mass**\n• They respawn over time after being eaten\n• Denser pellet areas are safer for small cells (harder for large cells to maneuver)\n• Some servers have **larger pellets** (5–10 mass) as a special feature\n• **Ejected mass** (from pressing Feed/W) also appears as pellets that others can eat\n\n**Early game tip:** Eat as many pellets as possible before engaging other players. Reaching ~50–100 mass from pellets lets you safely eat other newly-spawned cells.",
  },
  {
    keywords: ["speed", "cell speed", "movement speed", "how fast", "smaller faster", "big slow"],
    answer:
      "**Cell Speed** ⚡\n\n**The smaller you are, the faster you move.**\n\nSpeed formula: inversely proportional to cell size\n• A tiny cell (under 50 mass) moves extremely fast\n• A medium cell (500–1000 mass) moves at moderate speed\n• A giant cell (10,000+ mass) moves very slowly\n\n**Split speed boost:** When you split, split cells travel fast initially, then slow to normal speed. This temporary burst is what makes splits dangerous — they cover ground faster than the enemy can react.\n\n**Agario Mobile note:** The Boost ability can temporarily speed up your cell regardless of size.",
  },
  {
    keywords: ["boost", "speed boost", "boost ability", "mobile boost", "boost button"],
    answer:
      "**Speed Boost (Agario Mobile)** 🚀\n\nA Mobile-exclusive ability:\n• Tap the **Boost button** to launch your cell forward at high speed\n• Duration: ~1–3 seconds\n• Has a cooldown before it can be used again\n• Works regardless of your cell's current size\n\n**Best uses:**\n• Escape from a large enemy chasing you\n• Chase down a fleeing smaller cell\n• Quickly grab a large mass cluster\n• Dodge a virus being shot at you\n• Get to the center of the map quickly in Battle Royale",
  },

  // ═══════════════════════════════════════════════════════
  //  MOBILE EXCLUSIVE FEATURES
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["mystery box", "mystery crate", "box opening", "loot box", "crate opening"],
    answer:
      "**Mystery Boxes in Agario Mobile** 📦\n\nRandomized reward containers:\n\n**How to get Mystery Boxes:**\n• Level up milestones\n• Daily login rewards\n• Event completions\n• Purchasing with real money\n• Sometimes as clan rewards\n\n**Box tiers:**\n1. **Basic Box** — Common skins, small DNA amounts\n2. **Silver Box** — Rare skins, more DNA\n3. **Gold Box** — Epic skins, large DNA amounts\n4. **Diamond Box** — Legendary/Animated skins\n\n**Tips:**\n• Save Gold/Diamond boxes for events when exclusive skins are in the pool\n• Basic boxes are best opened immediately (low value)\n• You never get duplicate skins from boxes",
  },
  {
    keywords: ["daily mission", "missions", "daily task", "quest", "daily quest"],
    answer:
      "**Daily Missions in Agario Mobile** 📋\n\nComplete 3 missions per day for free rewards:\n\n**Example missions:**\n• Eat X number of cells\n• Survive for X minutes\n• Reach X mass\n• Win a Battle Royale match\n• Eat X pellets\n• Use boost X times\n\n**Rewards:** DNA, XP, Mystery Boxes, occasionally skins\n\n**Tips:**\n• Complete missions daily without fail — they stack into large DNA amounts over time\n• Some missions are easier in specific modes (survival missions → Teams mode)\n• 7-day streak gives a bonus reward",
  },
  {
    keywords: ["event", "events", "seasonal event", "limited event", "event skin"],
    answer:
      "**Events in Agario Mobile** 🎊\n\nTime-limited special events:\n\n**Types of events:**\n• **Seasonal** — Halloween, Christmas, New Year, Summer\n• **Collaboration** — with movies, games, brands\n• **Anniversary** — Agario birthday events\n• **Community** — player-voted themes\n\n**Event rewards:**\n• Exclusive skins (not available after event ends)\n• DNA bonuses\n• Special mystery boxes\n• Temporary event modes\n\n**How events work:**\n• Complete event missions to earn event currency\n• Spend event currency in the event shop\n• Some skins require completing all event stages\n\n⚠️ Event skins that expire are GONE — they rarely or never return. Prioritize them!",
  },
  {
    keywords: ["battle pass", "season pass", "pass", "agario pass"],
    answer:
      "**Battle Pass in Agario Mobile** 🎫\n\nA seasonal progression system (when available):\n• Earn XP during matches to progress through tiers\n• **Free tiers** — basic rewards for all players\n• **Premium tiers** — requires purchasing the pass (real money)\n• Rewards: skins, DNA, mystery boxes, titles, emotes\n\n**Tips:**\n• Complete daily missions while the pass is active — they give the most XP\n• Premium pass is worth it if you play daily and want exclusive skins\n• The pass expires at the end of the season — use all your tier rewards!",
  },
  {
    keywords: ["level up", "leveling", "xp", "experience points", "level rewards"],
    answer:
      "**Leveling System in Agario Mobile** 📊\n\nYou gain XP by:\n• Playing matches (more mass = more XP)\n• Eating other players\n• Completing missions\n• Surviving longer\n• Winning Battle Royale\n\n**Level rewards:**\n• Mystery boxes every few levels\n• DNA at milestone levels (10, 20, 50, 100...)\n• Titles and profile badges\n• Unlocked game features\n\n**Fastest XP methods:**\n1. Complete daily missions\n2. Play Battle Royale (high survival XP)\n3. Use XP boosters if available\n4. Play in busy servers (more cells to eat)",
  },

  // ═══════════════════════════════════════════════════════
  //  CONTROLS & SETTINGS
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["controls", "how to play", "mobile controls", "joystick", "tap control", "buttons"],
    answer:
      "**Agario Mobile Controls** 🎮\n\n**Movement options:**\n• **Joystick mode** — Virtual joystick in bottom-left corner (recommended)\n• **Tap-to-move** — Tap anywhere on screen to move toward that point\n• **Tilt** — Some versions support phone tilt movement\n\n**Action buttons:**\n• **Split** — Splits your cell toward your movement direction (right side)\n• **Feed (W)** — Ejects a small mass pellet in movement direction (right side)\n• **Boost** — Activates speed boost (if available)\n\n**Tips:**\n• Joystick mode gives the most control\n• The split/feed buttons are on the right side — customize their position in settings if needed\n• Enable 'Aim Lock' in settings for more precise splitting",
  },
  {
    keywords: ["settings", "graphics settings", "performance", "fps", "lag fix", "improve fps"],
    answer:
      "**Agario Mobile Settings & Performance** ⚙️\n\n**Key settings:**\n• **Graphics Quality** — Lower for better performance on old phones\n• **Show Skins** — Disable to reduce lag (shows solid colors instead)\n• **Cell Names** — Toggle on/off\n• **FPS Display** — Enable to monitor performance\n• **Notifications** — Disable if annoying\n\n**Lag reduction tips:**\n• Set graphics to Medium or Low\n• Close background apps before playing\n• Use WiFi instead of cellular data\n• Play during off-peak hours\n• Connect to the server closest to your location",
  },

  // ═══════════════════════════════════════════════════════
  //  GENERAL STRATEGY
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["strategy", "how to win", "tips", "pro tips", "beginner tips", "get better", "how to get big"],
    answer:
      "**Agario Mobile Strategy Guide** 🧠\n\n**Early Game (0–200 mass):**\n• Eat pellets near the edge of the map\n• Avoid all other players\n• Hide near viruses if chased\n\n**Mid Game (200–2000 mass):**\n• Start hunting smaller cells\n• Learn to trick split\n• Group up with allies if possible\n\n**Late Game (2000+ mass):**\n• Use cannons and split feeds with teammates\n• Target the leaderboard top cells with coordinated attacks\n• Use viruses to pop large enemies\n• Control the center of the map\n\n**Universal rules:**\n• Bigger = slower — use your speed when small\n• Never split recklessly — check for threats first\n• Watch the minimap — know where large threats are\n• Merge before engaging large enemies",
  },
  {
    keywords: ["solo strategy", "play alone", "no team solo", "1v1", "solo win"],
    answer:
      "**Solo Strategy (No Teaming)** 🦅\n\n**Survival tips:**\n• Stay at map edges — harder to be surrounded\n• Use viruses as shields when small\n• Split only when you're 100% sure you'll catch someone\n\n**Hunting tips:**\n• Trick split to catch faster small cells\n• Bait enemies by acting smaller than you are\n• Chase enemies toward dead ends (corners)\n\n**Dominating tips:**\n• Shoot viruses at large enemies, eat the pieces\n• Use the Boost to escape sticky situations\n• Keep 2 cells instead of 1 — more flexibility for splitting",
  },

  // ═══════════════════════════════════════════════════════
  //  ASHOT & BOTS
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["ashot", "who is ashot"],
    answer:
      "**Ashot** is a key member of this Agario community known for creating bots and managing server features. He's working on some exciting projects for the community — stay tuned! 👀",
  },

  // ═══════════════════════════════════════════════════════
  //  SERVERS & TECHNICAL
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["server", "region", "server region", "best server", "server select"],
    answer:
      "**Agario Servers & Regions** 🌍\n\nAgario Mobile automatically connects to the nearest server. Available regions:\n• **North America** (US East, US West)\n• **Europe** (EU West, EU East)\n• **Asia** (Asia East, Southeast Asia)\n• **South America**\n• **Oceania**\n\n**How to change region:**\n• Go to Settings → Server Region\n• Select a different region\n• Lower ping = smoother gameplay\n\n**Why change regions:** Some regions are less crowded (easier competition), some have different time zones of peak activity, or you might have friends on a specific region.",
  },
  {
    keywords: ["lag", "ping", "high ping", "lag fix", "connection", "disconnect"],
    answer:
      "**Reducing Lag in Agario Mobile** 📶\n\n**Causes of lag:**\n• Weak internet connection\n• Too far from server region\n• Overloaded server\n• Phone running too many apps\n\n**Fixes:**\n1. Use **WiFi** instead of cellular data\n2. Close all background apps\n3. Switch to a **closer server region**\n4. Lower graphics settings\n5. Restart the app and router\n6. Play at off-peak hours (fewer players = less server load)\n7. Don't use a VPN (adds latency)\n\n**If you keep disconnecting:** Check Miniclip's social media for server outages.",
  },

  // ═══════════════════════════════════════════════════════
  //  GENERAL INFO
  // ═══════════════════════════════════════════════════════
  {
    keywords: ["what is agario", "agar.io", "agario game", "how to play agario", "agario explain"],
    answer:
      "**Agario (agar.io)** 🟢\n\nAgario is a massively multiplayer game where you control a circular cell on a giant petri dish map.\n\n**Goal:** Eat everything smaller than you. Avoid everything larger. Become the biggest cell.\n\n**Basic rules:**\n• You need 10% more mass to eat another cell\n• Eat colored pellets (1 mass each) to grow\n• Press Split to divide your cell into two fast-moving halves\n• Press Feed to eject mass (helps teammates or shoots viruses)\n\n**Created by:** Matheus Valadares (2015)\n**Owned by:** Miniclip\n**Available on:** PC (browser at agar.io), iOS, Android",
  },
  {
    keywords: ["miniclip", "developer", "support", "report bug", "contact agario"],
    answer:
      "**Miniclip / Agario Support** 📧\n\nAgario is owned and operated by **Miniclip**.\n\n**Contact/Support:**\n• In-app: Settings → Help → Contact Support\n• Website: miniclip.com/support\n• Social: @agarioofficial on Instagram, @agar_io on Twitter/X\n\n**Report bugs:** Through the in-app feedback button (Settings → Feedback)\n**Report cheaters:** Through the in-game report button\n\n**Response time:** Usually 1–5 business days for support tickets.",
  },
];

// ─── Topic detection keywords ─────────────────────────────────────────────────
export const AGARIO_TOPIC_KEYWORDS = [
  "agario", "agar.io", "agar io", "cell", "split", "feed", "virus",
  "mass", "pellet", "merge", "eat", "skin", "dna", "miniclip",
  "trick", "cannon", "dodge", "escape", "leaderboard", "clan", "team",
  "server", "ffa", "bot", "bots", "pellet", "mobile", "boost",
  "mystery box", "level", "xp", "rank", "blob", "zoom", "eject", "w key",
  "spacebar", "glitch", "lag", "ping", "private server", "mod",
  "custom skin", "skins", "dna", "battle royale", "party mode",
  "trick split", "split feed", "feed split", "multi split",
  "clan war", "clan tag", "teaming", "lure", "bait", "tower",
  "recombine", "spawn", "freeze", "decay", "pellet", "joystick",
  "settings", "fps", "region", "mission", "event", "mystery", "box",
  "battle pass", "level up", "animated skin", "legendary", "epic",
  "shoot virus", "virus pop", "virus shoot", "agariobot", "agario bot",
];

/**
 * Checks if a message is related to Agario.
 */
export function isAgarioRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return AGARIO_TOPIC_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Finds the best matching knowledge entry for a question.
 */
export function findAnswer(text: string): string | null {
  const lower = text.toLowerCase();
  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of AGARIO_KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        score += kw.length * 2; // weight by length for specificity
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Require minimum score to avoid weak matches
  if (bestScore >= 4 && bestEntry) {
    return bestEntry.answer;
  }
  return null;
}
