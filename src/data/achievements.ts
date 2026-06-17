export interface ConstellationMeta {
  name: string;
  relatedSources: string[];
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  agentId?: string;
  constellation: ConstellationMeta;
  condition: {
    type: "total_turns" | "energy_bits" | "bond_level" | "easter_eggs" | "truth_shards" | "total_conversations";
    agentId?: string;
    threshold: number;
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "coffee_regular",
    name: "Mending Regular",
    description: "Complete 10 conversations with Nuannuan",
    icon: "🌸",
    agentId: "nuannuan",
    constellation: { name: "The Mender", relatedSources: ["chat"] },
    condition: { type: "total_turns", agentId: "nuannuan", threshold: 10 },
  },
  {
    id: "latte_soulmate",
    name: "Heart Companion",
    description: "Reach Close bond with Nuannuan",
    icon: "💕",
    agentId: "nuannuan",
    constellation: { name: "The Needle", relatedSources: ["chat"] },
    condition: { type: "bond_level", agentId: "nuannuan", threshold: 4 },
  },
  {
    id: "fireproof",
    name: "Tongue Shield",
    description: "Collect 100 energy with Laowang",
    icon: "🔥",
    agentId: "laowang",
    constellation: { name: "The Sharp Tongue", relatedSources: ["chat", "emotion"] },
    condition: { type: "energy_bits", agentId: "laowang", threshold: 100 },
  },
  {
    id: "breakthrough",
    name: "Wake-Up Call",
    description: "Complete 20 conversations with Laowang",
    icon: "💅",
    agentId: "laowang",
    constellation: { name: "The Breakthrough", relatedSources: ["chat"] },
    condition: { type: "total_turns", agentId: "laowang", threshold: 20 },
  },
  {
    id: "trail_companion",
    name: "Trail Companion",
    description: "Complete 15 conversations with Arthur",
    icon: "🌲",
    agentId: "mentor",
    constellation: { name: "The Trail", relatedSources: ["chat", "enneagram"] },
    condition: { type: "total_turns", agentId: "mentor", threshold: 15 },
  },
  {
    id: "campfire_bond",
    name: "Campfire Bond",
    description: "Reach Trusted bond with Arthur",
    icon: "🔥",
    agentId: "mentor",
    constellation: { name: "The Campfire", relatedSources: ["chat"] },
    condition: { type: "bond_level", agentId: "mentor", threshold: 3 },
  },
  {
    id: "hype_squad",
    name: "Dream Companion",
    description: "Complete 10 conversations with Yunsheng",
    icon: "🌙",
    agentId: "yunsheng",
    constellation: { name: "The Moonlight", relatedSources: ["chat"] },
    condition: { type: "total_turns", agentId: "yunsheng", threshold: 10 },
  },
  {
    id: "main_character",
    name: "Recognized in the Dream",
    description: "Reach Close bond with Yunsheng",
    icon: "🦋",
    agentId: "yunsheng",
    constellation: { name: "The Blue Flowers", relatedSources: ["chat"] },
    condition: { type: "bond_level", agentId: "yunsheng", threshold: 4 },
  },
  {
    id: "first_step",
    name: "First Conversation",
    description: "Complete your first meaningful conversation",
    icon: "🌱",
    constellation: { name: "The Beginning", relatedSources: ["chat"] },
    condition: { type: "total_conversations", threshold: 1 },
  },
  {
    id: "soul_explorer",
    name: "Soul Explorer",
    description: "Have a conversation with every character",
    icon: "🔮",
    constellation: { name: "The Explorer", relatedSources: ["mbti", "enneagram", "zodiac", "emotion"] },
    condition: { type: "total_conversations", threshold: 4 },
  },
  {
    id: "energy_collector",
    name: "Energy Collector",
    description: "Collect 300 total energy",
    icon: "⚡",
    constellation: { name: "The Energy", relatedSources: ["chat"] },
    condition: { type: "energy_bits", threshold: 300 },
  },
  {
    id: "shard_hunter",
    name: "Shard Hunter",
    description: "Collect 5 truth shards",
    icon: "💎",
    constellation: { name: "The Hunter", relatedSources: ["chat", "mbti"] },
    condition: { type: "truth_shards", threshold: 5 },
  },
  {
    id: "egg_finder",
    name: "Easter Egg Finder",
    description: "Trigger 2 hidden easter eggs",
    icon: "🥚",
    constellation: { name: "The Seeker", relatedSources: ["chat"] },
    condition: { type: "easter_eggs", threshold: 2 },
  },
];
