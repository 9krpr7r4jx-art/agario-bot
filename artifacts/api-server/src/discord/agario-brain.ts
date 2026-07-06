/**
 * Agario Brain — local NLU (Natural Language Understanding) engine.
 * No external API needed. Understands questions regardless of phrasing.
 */

// ─── Text normalisation ────────────────────────────────────────────────────────

const CONTRACTIONS: Record<string, string> = {
  "can't": "cannot",
  "can not": "cannot",
  "won't": "will not",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "i'm": "i am",
  "i've": "i have",
  "i'll": "i will",
  "you're": "you are",
  "what's": "what is",
  "how's": "how is",
  "where's": "where is",
  "when's": "when is",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "they're": "they are",
  "we're": "we are",
  "we've": "we have",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  "y'all": "you all",
  "gonna": "going to",
  "wanna": "want to",
  "gotta": "got to",
  "kinda": "kind of",
  "lotta": "lot of",
  "lemme": "let me",
  "gimme": "give me",
  "u": "you",
  "ur": "your",
  "r": "are",
  "pls": "please",
  "plz": "please",
  "thx": "thanks",
  "idk": "i do not know",
  "imo": "in my opinion",
  "btw": "by the way",
  "tbh": "to be honest",
  "ngl": "not going to lie",
  "rn": "right now",
  "rly": "really",
  "wat": "what",
  "wut": "what",
  "wen": "when",
  "hw": "how",
  "hows": "how is",
  "whats": "what is",
  "cuz": "because",
  "bc": "because",
  "b4": "before",
  "4": "for",
  "2": "to",
  "4ever": "forever",
  "omg": "oh my god",
  "lol": "",
  "lmao": "",
  "wtf": "what the",
  "bruh": "",
  "bro": "",
  "dude": "",
  "ayo": "",
  "yo": "",
  "fr": "for real",
  "nah": "no",
  "yeah": "yes",
  "yea": "yes",
  "yep": "yes",
  "nope": "no",
  "asap": "as soon as possible",
};

const SYNONYMS: Record<string, string[]> = {
  // Cell / character
  cell: ["blob", "circle", "bubble", "ball", "character", "player", "me", "my cell"],
  // Growth
  grow: ["get bigger", "get larger", "increase mass", "gain mass", "grow up", "get big", "become big", "enlarge"],
  mass: ["size", "weight", "points", "score", "how big"],
  eat: ["consume", "absorb", "swallow", "kill", "kill player", "eliminate", "devour", "take", "get eaten", "being eaten", "ate"],
  // Skins
  skin: ["appearance", "look", "design", "outfit", "cosmetic", "style", "theme", "costume", "color", "colour", "image"],
  // DNA
  dna: ["currency", "coins", "money", "gems", "points", "credit", "credits", "cash", "resources"],
  // Split
  split: ["divide", "cut", "separate", "break", "launch", "shoot", "fire"],
  // Feed
  feed: ["eject", "throw", "give mass", "send mass", "pass mass", "share mass", "donate mass", "w key", "press w"],
  // Virus
  virus: ["spike", "spiky", "green ball", "green circle", "green dot", "explosion", "pop", "explode"],
  // Merge
  merge: ["combine", "reunite", "rejoin", "come back together", "recombine", "join back", "merge back"],
  // Escape
  escape: ["run", "flee", "get away", "survive", "dodge", "avoid", "evade", "not die", "dont die", "stop dying", "keep alive"],
  // Win
  win: ["dominate", "get first", "be number 1", "be #1", "top leaderboard", "best score", "biggest", "be the best", "rank 1"],
  // Clan
  clan: ["team", "group", "guild", "squad", "crew", "club", "org", "organization"],
  // Event
  event: ["seasonal", "limited time", "holiday", "special", "halloween", "christmas", "summer", "easter", "anniversary"],
  // Buy/get
  buy: ["purchase", "get", "obtain", "acquire", "unlock", "earn", "how to get"],
  // Free
  free: ["without money", "no money", "no cost", "for free", "gratis", "without paying", "cheap", "without spending"],
  // Boost
  boost: ["speed boost", "dash", "rush", "sprint", "turbo", "fast move"],
  // Box
  "mystery box": ["loot box", "crate", "box", "chest", "reward box", "surprise box"],
  // Tips
  tips: ["advice", "help", "guide", "tutorial", "how to", "tricks", "strategies", "best way", "secrets", "pro tips"],
  // Lag
  lag: ["latency", "delay", "ping", "fps drop", "freeze", "stutter", "slow", "choppy", "connection issue", "disconnect"],
  // Hack (dangerous — used in hack detection too)
  // NOTE: "mod" is intentionally NOT here — mods are legitimate and should be answered
  hack: ["cheat", "exploit", "glitch abuse", "aimbot", "bot script", "modded apk"],
};

export function normalise(text: string): string {
  let t = text.toLowerCase();

  // Expand contractions (longest first to avoid partial matches)
  const contractionKeys = Object.keys(CONTRACTIONS).sort((a, b) => b.length - a.length);
  for (const k of contractionKeys) {
    t = t.replace(new RegExp(`\\b${escapeRegex(k)}\\b`, "gi"), CONTRACTIONS[k]!);
  }

  // Remove punctuation except hyphens inside words
  t = t.replace(/[^a-z0-9\s-]/g, " ");

  // Collapse whitespace
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Expand synonyms: replaces known synonym phrases with a canonical form */
function expandSynonyms(text: string): string {
  let t = text;
  for (const [canonical, synonymList] of Object.entries(SYNONYMS)) {
    for (const syn of synonymList) {
      if (t.includes(syn)) {
        t = t.replace(new RegExp(escapeRegex(syn), "g"), canonical);
      }
    }
  }
  return t;
}

/** Full pre-processing pipeline */
export function processText(raw: string): string {
  return expandSynonyms(normalise(raw));
}

// ─── Hack detection ────────────────────────────────────────────────────────────

const HACK_PATTERNS = [
  // Explicit Agario cheating tools
  /\bmod[\s-]?menu\b/i,
  /\b(aimbot|speedhack|wallhack)\b/i,
  /\b(unlimited[\s-]?dna|free[\s-]?dna[\s-]?hack|dna[\s-]?generator|dna[\s-]?cheat)\b/i,
  /\b(cheat[\s-]?engine|memory[\s-]?edit(or|ing)?)\b/i,
  /\b(apk[\s-]?mod|modded[\s-]?apk|apk[\s-]?hack)\b/i,
  /\b(auto[\s-]?split[\s-]?bot|bot[\s-]?script|auto[\s-]?play[\s-]?bot)\b/i,
  /\b(injector|trainer)\b/i,
  /how\s+to\s+get\s+(infinite|unlimited)\s+dna/i,
  /\b(hack|hacking|hacked)\s+(agario|agar|the\s+game|dna|server)\b/i,
];

export function isHack(rawText: string): boolean {
  return HACK_PATTERNS.some((p) => p.test(rawText));
}

// ─── Bots-ready / Ashot detection ─────────────────────────────────────────────

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

export function isBotsReady(rawText: string): boolean {
  return BOTS_READY_PATTERNS.some((p) => p.test(rawText));
}

// ─── Knowledge intents ─────────────────────────────────────────────────────────

export interface Intent {
  /** Keywords that must appear in the processed text (ANY one matches) */
  triggers: string[];
  /** Optional: ALL of these must be present for this intent to fire */
  required?: string[];
  /** Bonus keywords that increase the score */
  boost?: string[];
  answer: string;
}

export const INTENTS: Intent[] = [

  // ══════════════════════════════════════════════════════
  //  WHAT IS AGARIO
  // ══════════════════════════════════════════════════════
  {
    triggers: ["what is agario", "what is agar", "agario explain", "how does agario work", "never played", "new to agario", "just started", "explain agario", "agario game", "what agario"],
    answer: `**What is Agario?** 🟢

Agario (agar.io) is a massively multiplayer online game where you control a **circular cell** in a giant petri dish.

**The goal:** Eat everything smaller than you. Avoid everything bigger. Become #1 on the leaderboard.

**Basic rules:**
• You need to be **at least 10% bigger** to eat another cell
• Eat colored **pellets** (1 mass each) to grow
• Press **Split** to divide your cell into two fast halves — great for catching prey
• Press **Feed (W)** to eject a tiny mass pellet at allies or viruses

**Created by:** Matheus Valadares (2015)
**Operated by:** Miniclip
**Available on:** Browser (agar.io), iOS & Android (Agario Mobile)

💡 Start small, stay safe near the edges, eat pellets until you're big enough to hunt!`,
  },

  // ══════════════════════════════════════════════════════
  //  HOW TO GROW / GET BIG / WIN
  // ══════════════════════════════════════════════════════
  {
    triggers: ["how to grow", "get bigger", "get larger", "gain mass", "increase mass", "how to get big", "how to become big", "grow fast", "grow quickly", "get mass", "how to win", "how to dominate", "how to be number 1", "how to get first", "top leaderboard"],
    answer: `**How to Grow & Dominate** 🏆

**Early game (0–200 mass):**
• Eat pellets near map edges — safe from big players
• Avoid everyone until you have enough mass to fight
• Hide behind viruses if chased

**Mid game (200–2000 mass):**
• Start hunting players around your size or smaller
• Learn **trick split** to catch fast players
• Group up with teammates for split feeds

**Late game (2000+ mass):**
• Use **cannons** (teammates feed you → you fire a massive split)
• **Shoot viruses** at large enemies to pop them, then eat pieces
• Control the center of the map
• Use **split feeds** with allies to grow rapidly

**Universal tips:**
• Bigger = **slower** — use your speed advantage when small
• Never split unless you're sure it'll hit
• Watch the minimap for large threats
• Mass **decays** over time — keep eating!`,
  },

  // ══════════════════════════════════════════════════════
  //  HOW TO NOT DIE / SURVIVE / ESCAPE
  // ══════════════════════════════════════════════════════
  {
    triggers: ["how to survive", "how to not die", "stop dying", "keep dying", "always die", "getting eaten", "i keep getting eat", "how to escape", "how to run", "how to flee", "how to dodge", "avoid big", "someone chasing", "being chased"],
    answer: `**How to Survive & Not Die** 🛡️

**When someone bigger is chasing you:**
• **Zigzag** — unpredictable movement is harder to catch
• **Head toward viruses** — large players won't follow you there
• **Split perpendicular** to their direction — your pieces scatter sideways, harder to eat
• **Use Boost** (Mobile) to dash away instantly
• Run toward the **map edges** — corners limit their movement

**General survival tips:**
• Stay **small on purpose** early game — you're faster and immune to viruses
• Never camp in open space — hug edges or viruses
• Don't split blindly — check the area first
• If you're split into many cells, **merge before big fights**
• Watch the minimap constantly — know where threats are

**The 10% rule:** Someone needs to be 10% bigger to eat you. If you're close in size, you're actually safe — they can't eat you!`,
  },

  // ══════════════════════════════════════════════════════
  //  EATING RULES / WHO EATS WHO
  // ══════════════════════════════════════════════════════
  {
    triggers: ["who can eat who", "who eats who", "eating rule", "how to eat", "how to kill", "can eat", "cannot eat", "size to eat", "how much bigger", "10 percent", "mass to eat", "why cannot eat", "why can i not eat"],
    answer: `**Eating Rules in Agario** 🍽️

**Core rule:** You need to be **at least 10% larger** (1.1× the mass) to eat another cell.

**Examples:**
• Enemy has 100 mass → you need **110+** to eat them
• Enemy has 500 mass → you need **550+**
• Enemy has 10,000 mass → you need **11,000+**

**When split-eating:**
• Your split cell has ~half your total mass
• Make sure that half is still 10% bigger than the target!
• A 200-mass cell splitting → each half is ~100 mass → can only eat cells under ~90

**Cell absorption:** When your cell overlaps **more than 50%** of a smaller cell, it absorbs instantly

**You can't eat:**
• Cells the same size as you
• Cells larger than you (obviously)
• Viruses (they don't move, they pop you instead)

💡 Always check if you're big enough before committing to a split attack!`,
  },

  // ══════════════════════════════════════════════════════
  //  SPLIT — BASICS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["how to split", "what is split", "split button", "split attack", "split mechanic", "how does split work", "split distance", "split range"],
    answer: `**How Splitting Works** ⚡

Splitting divides your cell into **two equal halves** that shoot in your movement direction at high speed.

**Key facts:**
• Each half has ~half your original mass
• Split cells travel fast at first, then slow to normal speed
• You can split up to **4 times** (16 cells maximum)
• Cells **merge back** after a timer expires (30 sec for small, 90+ sec for huge)

**When to split:**
• Catch an enemy just out of normal reach
• Eat a cluster of small cells quickly
• Escape by splitting away from a chaser

**When NOT to split:**
• Near large enemies — your halves are weaker
• When already split into many pieces
• Without checking for threats first

📱 **Mobile:** Tap the **Split button** on the right side of the screen`,
  },

  // ══════════════════════════════════════════════════════
  //  TRICK SPLIT
  // ══════════════════════════════════════════════════════
  {
    triggers: ["trick split", "tricksplit", "how to trick split", "what is trick split", "split further", "longer split", "extra range split", "feed and split", "w split"],
    answer: `**Trick Split (Tricksplit)** ⚡

A split that travels **20–30% further** than a normal split by using ejected mass as extra momentum.

**How to do it on Mobile:**
1. Tap **Feed (W)** first
2. Immediately tap **Split** (within ~50ms)
3. The ejected mass pellet pushes the split cell further than usual

**Why it works:** The ejected pellet gives your split cell a momentum boost, extending the effective range. Enemies who think they're "safe distance" get caught off guard.

**Tips:**
• Works best with **300+ mass**
• Practice the timing in **Party Mode** with a friend
• Use it on players who backed off slightly from your normal split range
• Combine with the **Lure trick** — act small, then tricksplit when they get close`,
  },

  // ══════════════════════════════════════════════════════
  //  MULTI SPLIT / SPAM SPLIT
  // ══════════════════════════════════════════════════════
  {
    triggers: ["multi split", "multisplit", "spam split", "max split", "16 cell", "how many splits", "split multiple times", "split 4 times", "how many times can i split"],
    answer: `**Multi Split (Spam Split)** 💥

Splitting multiple times in rapid succession divides you into more cells:

| Splits | Cells |
|--------|-------|
| 1 | 2 cells |
| 2 | 4 cells |
| 3 | 8 cells |
| 4 | **16 cells** (maximum) |

**On Mobile:** Rapidly tap the Split button multiple times in the same direction.

**When to use:**
• Cover a wide area to eat many small cells at once
• Catch a group of scattered enemies
• Create chaos in crowded areas

**Danger:** Split into 16 cells = very vulnerable. Each piece is small and easy to eat. **Merge before engaging large enemies!** Your cells will start merging back automatically after the merge timer expires.`,
  },

  // ══════════════════════════════════════════════════════
  //  SPLIT FEED / FEED SPLIT / CANNON
  // ══════════════════════════════════════════════════════
  {
    triggers: ["split feed", "feed split", "splitfeed", "feedsplit", "how to team feed", "team technique", "cannon", "mass cannon", "feed cannon", "teammates feed me", "how to feed teammate"],
    answer: `**Team Techniques: Split Feed & Cannon** 🤝

**Split Feed:**
1. Player A splits toward Player B
2. Player B rapidly taps **Feed (W)** into Player A's split cells
3. Player A's cells merge back **bigger** than before
4. Repeat for rapid mass gain

**Cannon (most powerful):**
1. 2–5 teammates all feed one player simultaneously
2. The "cannon" player's mass grows huge
3. The cannon player fires a long-range split at an enemy
4. The enormous split cell covers much more distance — target can't escape

**Why it's devastating:** A 50,000+ mass cell splits much further and faster. Enemies who think they're safe are not.

**Counter:** Stay near viruses (they won't split there), or stay small enough that the cannon player can't eat you.

💡 Assign roles: **Feeders** (feed the cannon), **Tank** (the cannon), **Flankers** (clean up the pieces after)`,
  },

  // ══════════════════════════════════════════════════════
  //  MERGE / MERGE TIMER
  // ══════════════════════════════════════════════════════
  {
    triggers: ["merge", "how long to merge", "merge timer", "when do cells merge", "cells not merging", "how to merge faster", "recombine", "come back together", "rejoin", "merge time"],
    answer: `**Merging / Recombination** ⏱️

After splitting, your cells take time to merge back together automatically.

**Merge timer:**
• Small cells (under 100 mass): ~**30 seconds**
• Medium cells (1000 mass): ~**45–60 seconds**
• Large cells (10,000+ mass): ~**90+ seconds**
• The more mass, the longer it takes

**How to merge faster:**
• Stop moving and let cells drift toward each other naturally
• Don't keep splitting — each new split resets the timer on new pieces
• Stay still in a safe spot

**When to NOT merge:**
• While being chased — split cells move faster individually
• While hunting a cluster of small cells

**Key rule:** Two cells only merge if they're from the same player **AND** the merge timer has expired. You can't force it early.`,
  },

  // ══════════════════════════════════════════════════════
  //  VIRUSES
  // ══════════════════════════════════════════════════════
  {
    triggers: ["virus", "spike", "spiky ball", "green spiky", "what are virus", "green circle", "how does virus work", "virus pop", "explode from virus"],
    boost: ["what", "how", "explain", "use"],
    answer: `**Viruses** 🦠

Green spiky circles scattered across the map.

**If you touch a virus:**
• Under **133 mass** → completely safe, nothing happens
• Over **133 mass** → you **EXPLODE** into up to 16 pieces!

**Offensive use (shooting a virus):**
1. Aim at an existing virus
2. Tap **Feed (W) exactly 7 times** aimed at it
3. On the 7th feed, the virus splits and **launches toward your cursor**
4. Aim it at a large enemy to pop them into pieces, then eat the pieces!

**Defensive use:**
• Small cells can hide near viruses — large enemies won't chase you there
• Use viruses as a wall between you and a chaser

**Defending against an incoming virus:**
• **Pre-split** into 4–8 pieces before it hits (reduces total damage)
• Dodge sideways — viruses travel in a straight line
• Watch for enemies feeding a virus 7 times (it means an incoming virus attack!)`,
  },

  // ══════════════════════════════════════════════════════
  //  SHOOT VIRUS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["how to shoot virus", "fire virus", "send virus", "launch virus", "virus attack", "how to pop someone", "7 times feed", "how many feed virus", "how to use virus offensively"],
    answer: `**Shooting a Virus at an Enemy** 🎯

**Steps:**
1. Find a **virus (green spiky ball)** near an enemy
2. Aim your cell toward the virus
3. Tap **Feed (W) 7 times** in a row aimed at the virus
4. On the 7th feed, the virus **fires toward your cursor**
5. Guide it into the large enemy → they **EXPLODE** into up to 16 pieces
6. Rush in and eat the pieces!

**Requirements:**
• You need **133+ mass** to shoot a virus
• You need a virus nearby to launch

**Tips:**
• The virus travels in a straight line — aim **ahead** of a moving target
• Coordinate: you shoot the virus, teammates rush in to eat the exploded pieces
• Watch out — the explosion also creates new viruses on the map
• Multiple viruses can be chained if several are nearby`,
  },

  // ══════════════════════════════════════════════════════
  //  CUSTOM SKINS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["custom skin", "create skin", "make skin", "own skin", "design skin", "personal skin", "draw skin", "how to make skin", "skin editor", "my own skin"],
    answer: `**Creating a Custom Skin** 🎨

**Steps on Agario Mobile:**
1. Tap your **Profile** icon (top left in main menu)
2. Tap **Edit Cell** or the pencil icon
3. Choose **Custom Skin**
4. Draw directly on the cell using the built-in editor
5. Pick colors, shapes, and patterns
6. Tap **Save** to apply it

**Alternatively — import an image from your phone:**
1. Profile → Edit Cell → Custom Skin → **Gallery / Import**
2. Select a square image
3. Crop and confirm

**Best practices for imported images:**
• Size: **512×512px** (or 256×256)
• Format: **PNG** (transparent background looks cleanest)
• Keep the main design **centered** (cell edges curve away)
• Bright, simple designs are more visible during gameplay

⚠️ Custom skins are always visible to you. Other players may see a default skin unless their version supports custom skin viewing.`,
  },

  // ══════════════════════════════════════════════════════
  //  SKINS — GENERAL (equip, change, unlock)
  // ══════════════════════════════════════════════════════
  {
    triggers: ["how to equip skin", "how to change skin", "how to switch skin", "apply skin", "use skin", "skin not applying", "where to equip skin", "skin collection", "how to get skins", "unlock skin", "get all skins"],
    answer: `**Skins — How to Get & Equip Them** 🎮

**Equipping a skin:**
1. Tap **Profile icon** (top left in main menu)
2. Tap **Edit Cell** or the cell preview
3. Browse your collection
4. Tap a skin to preview → tap **Equip** or **Select**
5. Active in all game modes immediately

You can also change skins from the **pre-game lobby** before a match.

**How to unlock skins:**
• 🧬 **DNA Shop** — most skins, spend your DNA currency
• 📦 **Mystery Boxes** — random drops (no duplicates guaranteed)
• 🎊 **Events** — exclusive event skins (limited time!)
• 📅 **Daily login rewards**
• ⬆️ **Level up rewards**
• 🎫 **Battle Pass** tiers
• 💰 **Real money** direct purchase

💡 **Best free method:** Watch ads daily + complete daily missions → stack DNA → buy skins on sale`,
  },

  // ══════════════════════════════════════════════════════
  //  SKIN RARITIES
  // ══════════════════════════════════════════════════════
  {
    triggers: ["legendary skin", "epic skin", "rare skin", "rarest skin", "best skin", "skin rarity", "animated skin", "moving skin", "what rarity", "skin tier", "skin type"],
    answer: `**Skin Rarities & Best Skins** ⭐

**Rarity tiers (Common → Rarest):**
1. **Common** 🟤 — basic designs, easy to get (50–150 DNA)
2. **Rare** 🔵 — more detailed, DNA shop or mystery boxes (200–400 DNA)
3. **Epic** 🟣 — limited releases, special events (400–700 DNA)
4. **Legendary** 🟡 — extremely rare, seasonal exclusives (700–1500 DNA)

**Animated Skins** ✨ — Legendary/Epic skins with special visual effects:
• Glowing, rotating, or pulsing animations
• Only from high-tier Mystery Boxes, event shops, or premium bundles
• The most sought-after cosmetics in the game

**Most valuable skins:**
• **Event exclusives** — Halloween, Christmas editions (rarely return)
• **Collaboration skins** — with brands or games
• **Animated Legendary skins** — visually unique on the battlefield
• **Clan skins** — represent famous Agario clans

💡 Event skins are usually gone forever after the event ends — prioritize them!`,
  },

  // ══════════════════════════════════════════════════════
  //  SKIN GLITCH / SKIN NOT WORKING
  // ══════════════════════════════════════════════════════
  {
    triggers: ["skin not showing", "skin disappeared", "skin not working", "skin broken", "skin bug", "skin glitch", "skin reset", "skin not visible", "nobody can see skin", "other player skin", "skin not loading", "skin gone"],
    answer: `**Skin Not Showing? Here's How to Fix It** 🔧

**Skin not visible to other players:**
→ Equip a different skin, then re-equip your intended skin (server sync fix)

**Skin reset after a match:**
→ Go back to Profile → re-equip the skin you want

**Custom skin not saving:**
→ Make sure you tap **Save** before exiting the editor (easy to miss!)

**Skin appears as wrong skin:**
→ Visual desync — restart the app

**Purchased skin not appearing:**
→ Check your internet, then restart. If still missing: **Settings → Help → Contact Support** in-app

**Skin not showing to others at all:**
→ Some older game versions don't display custom skins to other players — this is a known limitation, not a bug you can fix on your end`,
  },

  // ══════════════════════════════════════════════════════
  //  DNA — WHAT IS IT
  // ══════════════════════════════════════════════════════
  {
    triggers: ["what is dna", "dna explain", "dna currency", "dna points", "what does dna do", "how does dna work", "dna agario"],
    answer: `**DNA — Agario Mobile Currency** 🧬

DNA is the **main currency** in Agario Mobile, used to buy skins and cosmetics.

**How to earn DNA (FREE):**
• 📺 Watch ads: 20–50 DNA each, up to 5–10 ads/day = **100–300 DNA/day for free**
• ✅ Complete **daily missions** (3 per day)
• 📅 **Daily login streak** — 7-day streak gives bonus DNA
• ⬆️ **Level up** milestones
• 🎊 **Event missions** — 50–200 DNA as prizes
• 📦 **Mystery boxes** sometimes contain DNA
• 🏆 **Clan events** and challenges

**How to earn DNA (Paid):**
• In-app purchases — bundle deals give more DNA per dollar

**DNA costs (approximately):**
• Common skin: 50–150 DNA
• Rare skin: 200–400 DNA
• Epic skin: 400–700 DNA
• Legendary skin: 700–1500 DNA`,
  },

  // ══════════════════════════════════════════════════════
  //  FREE DNA
  // ══════════════════════════════════════════════════════
  {
    triggers: ["free dna", "dna without money", "how to farm dna", "dna for free", "earn dna", "get dna free", "grind dna", "how many dna", "dna fast"],
    answer: `**Getting Free DNA Fast** 🆓

**Daily routine for maximum free DNA:**
1. 📺 **Watch all available ads** — fastest method (5–10 ads × 20–50 DNA each = 100–300 DNA/day)
2. ✅ **Complete all 3 daily missions** — each gives DNA + XP
3. 📅 **Login every single day** — 7-day streak bonus
4. 🎊 **Do events** — event missions often give 50–200 DNA
5. ⬆️ **Play to level up** — milestone levels give DNA rewards
6. 📦 **Open mystery boxes** — some contain DNA

**Over time:** Following this routine consistently, you can earn **3,000–6,000+ DNA per month for free** — enough for several Epic or Legendary skins.

**Save DNA for sales:** The shop occasionally has discounts. Wait for them before buying expensive skins!

⚠️ **Warning:** Apps or websites claiming to give "unlimited free DNA" are 100% scams that steal your Miniclip account. Never enter your login info on third-party sites.`,
  },

  // ══════════════════════════════════════════════════════
  //  BOOST (Mobile)
  // ══════════════════════════════════════════════════════
  {
    triggers: ["boost", "speed boost", "how to boost", "boost button", "dash", "speed up", "turbo", "go fast"],
    answer: `**Speed Boost (Agario Mobile Exclusive)** 🚀

A mobile-exclusive ability that launches your cell forward at high speed.

**How it works:**
• Tap the **Boost button** to activate
• Duration: **1–3 seconds** of high speed
• Has a **cooldown** before you can use it again
• Works at **any cell size** (even massive cells can boost)

**Best uses:**
• 🏃 **Escape** from a large enemy chasing you
• 🎯 **Chase down** a fleeing smaller cell that's just out of reach
• ⚡ **Dodge** a virus being shot at you
• 🏆 **Rush to the center** quickly in Battle Royale
• 📦 **Grab a large mass cluster** before someone else does

💡 Timing is everything — boost just as an enemy commits to splitting at you, and their split will miss!`,
  },

  // ══════════════════════════════════════════════════════
  //  BATTLE ROYALE
  // ══════════════════════════════════════════════════════
  {
    triggers: ["battle royale", "br mode", "shrinking map", "last cell standing", "toxic zone", "agario br", "battle royale mode", "how does battle royale work", "how to win battle royale"],
    answer: `**Battle Royale Mode** 👑 (Mobile Exclusive)

A special Agario Mobile mode where the map shrinks over time.

**How it works:**
• A **toxic zone** closes in from the edges — like a storm in other BR games
• Cells caught in the toxic zone **slowly lose mass**
• Last cell(s) alive win
• No teams — everyone for themselves

**Strategy to win:**
• **Stay near the center** as the zone shrinks — never get caught in the toxic zone
• **Be aggressive mid-game** — the zone forces everyone together, use that pressure
• **Don't be too huge** — you become a slow target; stay manageable size
• **Split to escape** if you're caught in the toxic zone
• **Use viruses** in late game when everyone is forced into close quarters — pop the big players!
• **Save your Boost** for critical escape moments

💡 Battle Royale gives the most XP per game — great for leveling up fast!`,
  },

  // ══════════════════════════════════════════════════════
  //  TEAMS MODE
  // ══════════════════════════════════════════════════════
  {
    triggers: ["teams mode", "how to play teams", "team mode", "colored teams", "how teaming works", "what is teams mode", "team strategy"],
    answer: `**Teams Mode** 🔵🔴🟢

Players are randomly assigned to a team color (usually Red, Green, Blue).

**Rules:**
• You **cannot eat** teammates of the same color
• Your team's combined mass determines the leaderboard ranking
• Cooperate to dominate the map

**Team tactics:**
• **Feed allies** — tap Feed (W) toward struggling teammates
• **Split feed** — coordinate to rapidly grow one teammate
• **Cannon** — mass up one player, they split at the enemy team
• **Block enemies** — use your large cell to block enemies from eating small teammates
• **Zone control** — spread team across the map to control territory
• **Focus fire** — multiple teammates target the same enemy simultaneously

💡 **Role assignment:**
• Assign one player as the "tank" (main fighter)
• Others as "feeders" (feed the tank)
• One player as "flanker" (attacks from unexpected angles)`,
  },

  // ══════════════════════════════════════════════════════
  //  FFA MODE
  // ══════════════════════════════════════════════════════
  {
    triggers: ["ffa", "free for all", "solo mode", "how to play ffa", "everyone vs everyone", "no team mode"],
    answer: `**FFA (Free For All) Mode** ⚔️

Classic Agario — everyone fights everyone. No permanent allies.

**FFA strategy:**
**Early game:**
• Eat pellets near map edges, avoid all other players

**Mid game:**
• Target players around your size or smaller
• Use trick split to catch fast players

**Late game:**
• Shoot viruses at large players, eat the pieces
• Lure big players toward viruses to pop them
• Use cell stacking and bait tricks

**Tips specific to FFA:**
• Informal teaming (two players helping each other) is common — not against rules
• A "teamer" buddy gives you a huge advantage vs solo players
• If someone feeds you, they're asking to team — feed back to confirm
• Use **Lure/Bait trick**: act small near a greedy enemy, then trick split to eat them

💡 FFA is the **best mode to practice individual skill** — every death teaches you something!`,
  },

  // ══════════════════════════════════════════════════════
  //  PARTY MODE
  // ══════════════════════════════════════════════════════
  {
    triggers: ["party mode", "play with friends", "private room", "invite friends", "room code", "how to party", "private server", "play friend"],
    answer: `**Party Mode — Play With Friends** 🎉

**How to create a room:**
1. Tap **Play → Party Mode**
2. Tap **Create**
3. You get a **room code**
4. Share the code with your friends

**How to join a room:**
1. Tap **Play → Party Mode**
2. Tap **Join Party**
3. Enter the code your friend shared
4. You spawn in the same server!

**What Party Mode is great for:**
• Practicing **trick splits** and **cannons** with allies
• **Clan training** sessions
• **Private tournaments** with your community
• Testing strategies and glitches safely
• Just having fun with friends

💡 This is the **best environment** to practice advanced techniques without the pressure of losing mass in a live match!`,
  },

  // ══════════════════════════════════════════════════════
  //  MASS DECAY
  // ══════════════════════════════════════════════════════
  {
    triggers: ["mass decay", "losing mass", "why losing mass", "mass decreasing", "shrinking over time", "why am i shrinking", "cell getting smaller", "mass going down", "why is my mass going down"],
    answer: `**Mass Decay — Why You Shrink** 📉

Your cell constantly loses a small percentage of mass over time — this is by design!

**The decay rate:**
• Approximately **1–2% per mass per second** (varies by server)
• Cells under ~**20 mass** don't decay (minimum threshold)
• Larger cells lose more mass in absolute terms (same % rate, bigger number)

**Why it exists:**
• Forces large players to keep eating
• Prevents one player from dominating forever without effort
• Creates a time pressure — you must stay active!

**Strategic use:**
• If you're dominant, you can "outlast" an enemy by **denying them food** while they slowly decay
• A very large cell that can't find food will eventually shrink to a manageable size
• Don't stop moving — always be eating pellets or players to maintain your mass

💡 Mass decay is why you need to keep playing aggressively even when you're big!`,
  },

  // ══════════════════════════════════════════════════════
  //  CLANS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["what is clan", "clan agario", "how do clan work", "agario clan", "what is a clan", "clan explain", "join clan", "find clan", "how to join clan", "clan recruitment"],
    answer: `**Clans in Agario Mobile** 🏆

Clans are organized groups of players who team together regularly.

**What clans do:**
• Share a **clan tag** in their names (e.g. \`[TAG] PlayerName\`)
• Coordinate via Discord, WhatsApp, or in-game clan chat
• Compete in **clan wars** against other clans
• Share strategies and training sessions
• Have clan-exclusive skins and rewards

**Clan hierarchy:**
Leader → Co-Leader/Officer → Member → Recruit/Trial

**How to find a clan:**
1. Check **recruitment channels** in this Discord server
2. Browse **Reddit** (r/agario)
3. Use the **in-game clan browser** (Clan button → Search)
4. Watch Agario YouTube/TikTok — streamers often recruit

**Benefits of joining:**
• Organized teaming = much easier to dominate
• Learn advanced techniques faster
• Participate in clan wars
• Get exclusive clan skins (some clans)
• Be part of a community!`,
  },

  // ══════════════════════════════════════════════════════
  //  CREATE CLAN
  // ══════════════════════════════════════════════════════
  {
    triggers: ["create clan", "make clan", "start clan", "found clan", "how to create clan", "start my own clan", "build clan", "setup clan"],
    answer: `**Creating Your Own Clan** ⚙️

**Steps:**
1. Tap the **Clan button** in the main menu
2. Tap **Create Clan**
3. Choose a **clan name** and **tag** (2–5 characters shown before names)
4. Write a clan description and set requirements
5. Set to **Public** (anyone can apply) or **Private** (invite only)
6. Pay the creation fee (DNA or coins)

**Running a successful clan:**
• Set **minimum level requirements** to filter inactive players
• Create a **Discord server** for team communication
• Hold **regular training sessions** in Party Mode
• Promote active/skilled players to officer rank
• Organize **clan wars** against rival clans
• Create a memorable, short **clan tag** (e.g. \`[ELT]\`, \`[GOD]\`)

💡 The tag is manually added to your nickname in **Profile settings** — remind all members to add it!`,
  },

  // ══════════════════════════════════════════════════════
  //  CLAN WARS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["clan war", "clan battle", "clan vs clan", "cvc", "how do clan wars work", "clan competition", "war against clan", "fight another clan"],
    answer: `**Clan Wars** ⚔️

Organized battles between two clans — the ultimate clan competition!

**How clan wars work:**
• Two clans agree on a **time, game mode, and server**
• They join the same server (Party Mode or public)
• Score is tracked by mass accumulated, cells eaten, or leaderboard position
• The clan with the **highest score** after the session wins

**Common war formats:**
• **Mass competition** — who reaches the highest total combined mass
• **Elimination** — most enemy cells eaten
• **Survival** — last clan member at top of leaderboard
• **Zone control** — control the center of the map the longest

**Preparation:**
• Practice **split feeds and cannons** in Party Mode beforehand
• **Assign roles:** Feeders, Tank/Cannon, Flankers, Scouts
• Set up a **voice channel** on Discord for real-time coordination
• Scout the enemy clan's playstyle before the war

🏆 Winning a clan war earns bragging rights and sometimes exclusive rewards!`,
  },

  // ══════════════════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["event", "seasonal event", "how do events work", "event skin", "limited event", "halloween event", "christmas event", "current event", "event rewards", "event mission", "event currency"],
    answer: `**Events in Agario Mobile** 🎊

Time-limited special events that offer exclusive rewards!

**Types of events:**
• 🎃 **Halloween** — spooky skins, special modes
• 🎄 **Christmas/New Year** — festive skins, bonus DNA
• ☀️ **Summer** — beach-themed content
• 🐣 **Easter** — seasonal cosmetics
• 🎂 **Anniversary** — Agario birthday events
• 🤝 **Collaborations** — with movies, games, brands

**How events work:**
1. Complete **event missions** to earn event currency
2. Spend event currency in the **event shop**
3. Some skins require completing **all event stages**
4. Events are **time-limited** — usually 1–3 weeks

**Event rewards:**
• Exclusive skins (not available after the event!)
• DNA bonuses
• Special mystery boxes
• Temporary special game modes

⚠️ **IMPORTANT:** Event skins are usually **gone forever** after the event ends. Prioritize them over regular shop purchases! They rarely or never return.`,
  },

  // ══════════════════════════════════════════════════════
  //  BATTLE PASS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["battle pass", "season pass", "agario pass", "what is battle pass", "is battle pass worth it", "pass rewards"],
    answer: `**Battle Pass / Season Pass** 🎫

A seasonal progression system that rewards you for playing regularly.

**How it works:**
• Earn **XP from matches and missions** to advance through tiers
• Each tier unlocks a reward
• **Free tiers:** Basic rewards available to all players
• **Premium tiers:** Requires purchasing the pass (real money) for exclusive rewards

**Premium pass rewards typically include:**
• Exclusive skins (not available anywhere else)
• Large DNA bundles
• Special mystery boxes
• Titles, emotes, profile badges

**Is it worth buying?**
• ✅ Worth it if you play **daily** and want the exclusive skins
• ❌ Not worth it if you play occasionally — you won't unlock all tiers before it expires

**Tips:**
• Complete **daily missions** while the pass is active — they give the most XP
• The pass **expires at season end** — claim all your tier rewards before then!
• Check the rewards list before buying to see if the skins appeal to you`,
  },

  // ══════════════════════════════════════════════════════
  //  MYSTERY BOXES
  // ══════════════════════════════════════════════════════
  {
    triggers: ["mystery box", "loot box", "crate", "box opening", "how mystery box work", "what is in mystery box", "box tier", "open box"],
    answer: `**Mystery Boxes** 📦

Randomized reward containers with skins, DNA, and more!

**Box tiers:**
| Box | Contents |
|-----|----------|
| 🟤 Basic | Common skins, small DNA |
| ⚪ Silver | Rare skins, more DNA |
| 🟡 Gold | Epic skins, large DNA |
| 💎 Diamond | Legendary / Animated skins |

**How to get boxes:**
• Level up milestones
• Daily login rewards
• Event completions
• Purchase with real money

**Good news:** You **never get duplicate skins** from boxes!

**Tips:**
• 💡 Save **Gold and Diamond boxes** for during events — when exclusive skins are in the reward pool, your odds of getting them improve
• Open Basic boxes immediately (low value regardless)
• Diamond boxes are the rarest — treat them carefully!`,
  },

  // ══════════════════════════════════════════════════════
  //  DAILY MISSIONS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["daily mission", "daily task", "quest", "daily quest", "how to complete mission", "mission reward", "what missions", "daily challenge"],
    answer: `**Daily Missions** 📋

Complete 3 missions per day for free rewards!

**Example mission types:**
• Eat X number of cells
• Survive for X minutes
• Reach X mass in a single game
• Win a Battle Royale match
• Eat X pellets
• Use Boost X times
• Split X times

**Rewards:** DNA, XP, Mystery Boxes, occasionally skins

**Pro tips:**
• ✅ **Do them every day without fail** — over weeks they add up to thousands of free DNA
• 🔄 Some missions are easier in specific modes:
  - "Survive X minutes" → **Teams Mode** (teammates protect you)
  - "Win Battle Royale" → **BR Mode** (obviously!)
  - "Eat X cells" → **FFA** with small split strategies
• 📅 **7-day streak** gives a bonus reward — don't break the streak!`,
  },

  // ══════════════════════════════════════════════════════
  //  LEVELS & XP
  // ══════════════════════════════════════════════════════
  {
    triggers: ["level up", "how to level up", "xp", "experience", "level rewards", "leveling fast", "level system", "how does level work", "how to get xp"],
    answer: `**Level System & XP** 📊

**How to earn XP:**
• Playing matches (more mass = more XP)
• Eating other players
• Completing daily missions ⭐ (most efficient)
• Surviving longer
• Winning Battle Royale
• Using XP boosters (if available)

**Level rewards:**
• 📦 Mystery boxes every few levels
• 🧬 DNA at milestone levels (10, 20, 50, 100...)
• 🏷️ Titles and profile badges
• 🔓 Unlocked game features

**Fastest XP methods:**
1. **Complete daily missions** every day — biggest XP source
2. **Play Battle Royale** — high XP per match for surviving
3. **Play in busy servers** — more cells to eat = more XP
4. **Use XP boosters** when available (events sometimes give them)

💡 Leveling is a long-term investment — the milestone rewards (especially at level 50 and 100) are very valuable!`,
  },

  // ══════════════════════════════════════════════════════
  //  CONTROLS / HOW TO PLAY
  // ══════════════════════════════════════════════════════
  {
    triggers: ["how to play", "controls", "mobile controls", "joystick", "buttons", "how to split mobile", "how to feed mobile", "how to move", "what button", "control settings"],
    answer: `**Agario Mobile Controls** 🎮

**Movement:**
• 🕹️ **Joystick mode** — virtual joystick bottom-left (recommended for control)
• 👆 **Tap-to-move** — tap anywhere to move toward that point
• 📱 Some versions support **tilt** movement

**Action buttons (right side of screen):**
• **SPLIT** — divides your cell toward your movement direction
• **FEED (W)** — ejects a small mass pellet in your direction (feeds allies or shoots viruses)
• **BOOST** — activates speed burst (Mobile exclusive)

**Settings to adjust:**
• **Aim Lock** — makes splitting more precise
• **Graphics Quality** — lower for better performance on older phones
• **Show Skins** — disable to reduce lag
• Move button positions to where your thumbs feel comfortable

💡 **Joystick mode** gives the most precise control — highly recommended over tap mode for competitive play!`,
  },

  // ══════════════════════════════════════════════════════
  //  LAG / FPS / PERFORMANCE
  // ══════════════════════════════════════════════════════
  {
    triggers: ["lag", "laggy", "fps", "frame rate", "how to fix lag", "reduce lag", "performance", "ping", "high ping", "connection problem", "disconnect", "game slow", "stuttering", "choppy"],
    answer: `**Fixing Lag & Performance Issues** 📶

**Common causes:**
• Weak internet connection
• Too far from the server region
• Phone running too many background apps
• Low-end phone struggling with graphics

**Fixes to try:**
1. 📶 Use **WiFi** instead of cellular data (biggest single improvement)
2. 📱 **Close all background apps** before playing
3. 🌍 Switch to a **closer server region** (Settings → Server Region)
4. ⚙️ Lower **graphics settings** to Medium or Low
5. 🔄 **Restart the app** and your router
6. ⏰ Play during **off-peak hours** (fewer players = less server load)
7. ❌ **Disable VPN** if you're using one (VPNs add latency)

**If you keep disconnecting:**
• Check Miniclip's social media (@agarioofficial) for server outages
• Try a different server region

💡 **Best combo:** WiFi + close all apps + closest region = maximum performance!`,
  },

  // ══════════════════════════════════════════════════════
  //  SERVER REGION
  // ══════════════════════════════════════════════════════
  {
    triggers: ["server region", "which server", "best server", "change server", "server select", "how to change server", "eu server", "us server", "asia server", "region select"],
    answer: `**Server Regions in Agario Mobile** 🌍

**Available regions:**
• 🇺🇸 North America (US East, US West)
• 🇪🇺 Europe (EU West, EU East)
• 🇯🇵 Asia (East Asia, Southeast Asia)
• 🇧🇷 South America
• 🇦🇺 Oceania

**How to change your region:**
Settings → Server Region → Select a region

**Why change regions?**
• 🏆 **Less competition** — some regions are less crowded (easier games)
• ⚡ **Lower ping** = smoother gameplay (always pick your closest region)
• 👥 **Friends on a specific region** — join theirs
• 🌙 **Off-peak times** — play on a region that's in daytime hours for more players

💡 **Lower ping = less lag = faster reactions.** Always connect to the region geographically closest to you for the best experience!`,
  },

  // ══════════════════════════════════════════════════════
  //  GLITCHES
  // ══════════════════════════════════════════════════════
  {
    triggers: ["glitch", "bug", "game bug", "known glitch", "list of glitch", "agario glitch", "visual bug", "gameplay bug"],
    answer: `**Known Glitches in Agario Mobile** 🐛

**Visual glitches:**
• Skin not displaying correctly → equip a different skin, re-equip yours
• Cell appears as wrong color in Teams → restart app
• Leaderboard shows wrong mass → server lag, refreshes automatically

**Gameplay glitches:**
• **Ghost cell** — part of your cell goes invisible but still exists (can be eaten!)
• **Mass freeze** — mass stops updating on screen but you're still growing
• **Split stuck** — a split cell freezes in place temporarily, usually recovers
• **Merge loop** — cells keep trying to merge but fail (server desync)
• **Clone cell** — two copies of your cell appear briefly

**Connection glitches:**
• **Teleport** — your cell jumps due to lag
• **Rubber band** — cell keeps snapping back to previous position

**How to fix most glitches:**
→ Restart the app
→ Switch to a different server region
→ Reconnect to better WiFi

Most glitches are caused by server lag, not by your device!`,
  },

  // ══════════════════════════════════════════════════════
  //  DODGE ENEMY SPLIT
  // ══════════════════════════════════════════════════════
  {
    triggers: ["dodge split", "avoid split", "how to not get split", "someone split at me", "escape from split", "anti split", "split dodge"],
    answer: `**Dodging Enemy Split Attacks** 🏃

When an enemy tries to split at you:

**In the moment:**
• **Zigzag** — unpredictable movement makes you much harder to target
• **Move toward them** (counterintuitive!) — the split travels forward past you
• **Split perpendicular** (90°) to their direction — your pieces scatter sideways
• **Head toward a virus** — most players won't split if it pops their cells

**Proactive dodging:**
• **Stay far enough away** — know the 10% rule and your size vs theirs
• **Stay near viruses** — permanent safe zones from large split attacks
• **Don't move in straight lines** — zigzag constantly

**Use Boost (Mobile):**
• If you see them line up for a split, **boost sideways** immediately
• The split travels in a straight line — boost perpendicular to dodge it

💡 The best dodge is **not being in range** — keep your distance and stay unpredictable!`,
  },

  // ══════════════════════════════════════════════════════
  //  LURE / BAIT TRICK
  // ══════════════════════════════════════════════════════
  {
    triggers: ["lure trick", "bait trick", "how to bait", "how to lure", "fake feed", "pretend small", "act small", "trick enemy"],
    answer: `**Lure / Bait Trick** 🎣

A deceptive technique to catch greedy players off guard!

**Basic lure:**
1. Move slowly near an enemy, acting like a small easy target
2. When they commit to chasing you, **trick split** to eat them
3. Works best when you're just slightly larger than your opponent

**Feed bait:**
1. Eject mass (Feed/W) near an enemy
2. They see the free mass and move toward it greedily
3. While they're focused on the ejected mass, **split to eat them**
4. They didn't notice you're just big enough to eat them!

**Advanced bait:**
• Act like you're scared — run away slowly, then suddenly turn and split
• Move toward a virus like you're panicking, but turn at the last second
• Team bait: your ally hides their large cell behind you, enemy splits at you, ally eats them

💡 The best bait works when the enemy is greedy. Patience is key — let them come to you!`,
  },

  // ══════════════════════════════════════════════════════
  //  SPAWN / RESPAWN
  // ══════════════════════════════════════════════════════
  {
    triggers: ["spawn", "respawn", "how to spawn", "spawn protection", "just spawned", "newly spawn", "after dying", "when i respawn", "spawn kill"],
    answer: `**Spawning & Respawning** 🌱

**When you first spawn:**
• You start with a small mass
• Brief **spawn protection** (a few seconds) — immune to being eaten
• After protection ends, large players can eat you

**Immediately after spawning:**
1. **Move quickly** away from your spawn point
2. Eat pellets rapidly to grow past the minimum threat threshold
3. Head toward **map edges** — fewer large players there
4. Hide near **viruses** if you see a large player

**Spawn killing** (someone camping at spawn areas to eat newly spawned cells):
• Not bannable but considered bad etiquette
• Counter: move in an unexpected direction immediately when you spawn
• Spawn locations are somewhat random — you might respawn elsewhere

💡 The most dangerous moment in Agario is right after spawning. Move fast, grow fast, and avoid everyone for the first 30–60 seconds!`,
  },

  // ══════════════════════════════════════════════════════
  //  MINICLIP / SUPPORT
  // ══════════════════════════════════════════════════════
  {
    triggers: ["miniclip", "contact support", "report bug", "agario support", "how to contact agario", "agario developer", "who made agario", "report cheater", "ban someone"],
    answer: `**Miniclip & Agario Support** 📧

Agario is owned and operated by **Miniclip**.

**How to contact support:**
• **In-app:** Settings → Help → Contact Support
• **Website:** miniclip.com/support
• **Social media:** @agarioofficial (Instagram), @agar_io (Twitter/X)

**Report a bug:**
Settings → Feedback (in-app button)

**Report a cheater:**
Use the in-game **report button** (tap their name → Report)

**Response times:**
Usually 1–5 business days for support tickets

**Account issues:**
If you lost your account or skins, contact support with your account details and a description of the issue. They can often restore purchases if you have proof (screenshots, purchase receipts).`,
  },

  // ══════════════════════════════════════════════════════
  //  PELLETS / FOOD
  // ══════════════════════════════════════════════════════
  {
    triggers: ["pellet", "food dot", "colored dot", "what are pellet", "how much pellet worth", "pellet mass", "food on map", "dots on map"],
    answer: `**Pellets / Food Dots** 🔵

The small colored circles scattered across the entire map.

**Stats:**
• Each pellet gives **1 mass**
• They respawn over time after being eaten
• Some servers have larger pellets (5–10 mass) as special features

**Ejected mass** (from pressing Feed/W) also becomes pellets that anyone can eat — including your enemies!

**Why pellets matter:**
• **Early game:** Pellets are your main source of food — eat as many as possible to reach 50–100 mass before engaging players
• **Dense pellet areas:** Safer for small cells (large cells can't maneuver easily in tight spaces)
• **Map edges:** Often have more pellets since large players avoid the corners

💡 **Starting strategy:** Rush the pellet-dense areas at spawn, reach 100+ mass from pellets alone, then you can safely hunt other newly-spawned players!`,
  },

  // ══════════════════════════════════════════════════════
  //  SPEED MECHANICS
  // ══════════════════════════════════════════════════════
  {
    triggers: ["cell speed", "how fast", "movement speed", "smaller faster", "big slow", "speed mechanic", "why small faster", "speed formula"],
    answer: `**Speed Mechanics in Agario** ⚡

**Core rule:** The **smaller** you are, the **faster** you move.

**Speed breakdown:**
• Tiny cell (under 50 mass) → **very fast**
• Medium cell (500–1000 mass) → **moderate speed**
• Giant cell (10,000+ mass) → **very slow**

**Split speed boost:**
When you split, your split cells initially travel very fast, then slow to normal speed. This burst is what makes splits dangerous — they cover ground faster than an enemy can react!

**Agario Mobile extra — Boost ability:**
• Provides a temporary speed burst regardless of your cell size
• Lets even massive cells move fast briefly

**Strategic implications:**
• When small: use your speed advantage to outmaneuver big players
• When big: use split speed to compensate for your slowness
• A large cell can be kited (chased without being caught) by a fast small cell that's just slightly too small to eat`,
  },

  // ══════════════════════════════════════════════════════
  //  ASHOT
  // ══════════════════════════════════════════════════════
  {
    triggers: ["who is ashot", "ashot", "ashot project", "what does ashot do", "ashot bot"],
    answer: `**Ashot** 👋

Ashot is a key and well-known member of this Agario community server. He's responsible for creating bots and managing various features for the server.

He's currently working on some exciting projects for the community — stay tuned for updates! 👀🎮`,
  },

];

// ─── Off-topic detection (not Agario-related at all) ──────────────────────────

const AGARIO_TOPIC_SIGNALS = [
  "agario", "agar.io", "agar io", "cell", "split", "feed", "virus",
  "mass", "pellet", "merge", "eat", "skin", "dna", "miniclip",
  "trick", "cannon", "dodge", "escape", "leaderboard", "clan", "team",
  "server", "ffa", "bot", "bots", "mobile", "boost",
  "mystery box", "level", "xp", "rank", "blob", "zoom", "eject",
  "glitch", "lag", "ping", "custom skin", "battle royale", "party mode",
  "trick split", "split feed", "feed split", "multi split",
  "clan war", "clan tag", "teaming", "lure", "bait", "tower",
  "recombine", "spawn", "freeze", "decay", "joystick",
  "mission", "event", "battle pass", "animated skin", "legendary",
  "epic", "rare", "common", "shoot virus", "virus pop",
  "ashot", "grow", "bigger", "smaller", "faster", "slower",
  "how to play", "how to win", "strategy", "tips", "guide",
  "game", "play", "playing",
];

export function isAgarioRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return AGARIO_TOPIC_SIGNALS.some((signal) => lower.includes(signal));
}

// ─── Scoring engine ───────────────────────────────────────────────────────────

export function findAnswer(rawText: string): string | null {
  const processed = processText(rawText);
  const originalLower = rawText.toLowerCase();

  let bestIntent: Intent | null = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    let score = 0;

    // Check triggers (any one match)
    for (const trigger of intent.triggers) {
      if (processed.includes(trigger) || originalLower.includes(trigger)) {
        score += trigger.split(" ").length * 3; // longer phrase = higher weight
      }
    }

    // Check required keywords (all must match, or disqualify)
    if (intent.required && score > 0) {
      const allRequired = intent.required.every(
        (r) => processed.includes(r) || originalLower.includes(r),
      );
      if (!allRequired) {
        score = 0;
        continue;
      }
    }

    // Boost score for bonus keywords
    if (intent.boost && score > 0) {
      for (const b of intent.boost) {
        if (processed.includes(b) || originalLower.includes(b)) {
          score += 2;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Minimum score threshold to avoid weak/wrong matches
  if (bestScore >= 3 && bestIntent) {
    return bestIntent.answer;
  }

  return null;
}
