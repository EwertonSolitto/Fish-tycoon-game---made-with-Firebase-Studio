
import type React from 'react';
import { Users, Ship, Briefcase, Settings2, Zap, PackagePlusIcon, UsersRound, Timer, CircleDollarSign, Eye, FastForward, Flame, Clock3, TrendingUp, Anchor, Wrench, BarChart3 } from 'lucide-react';

// Using React.ElementType for Lucide icons
export interface FishermanType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  initialCost: number;
  costIncreaseFactor: number;
  baseCollectionAmount: number; // fish collected per cycle at level 1
  baseCollectionTimeMs: number; // time in MS for one unit to complete a cycle (before quantity scaling)
  minCollectionTimeMs: number; // minimum possible collection time for this type
  baseUpgradeCost: number; // cost to upgrade the entire crew of this type from L1 to L2
  upgradeCostIncreaseFactor: number;
}

export const FISHERMAN_TYPES: FishermanType[] = [
  {
    id: 'novice_fisher',
    name: 'Novice Fisher',
    description: 'A beginner at sea. Periodically brings in a small catch.',
    icon: Users,
    initialCost: 20,
    costIncreaseFactor: 1.15,
    baseCollectionAmount: 5, // Collects 5 fish
    baseCollectionTimeMs: 8000, // Base time 8 seconds for 1 unit
    minCollectionTimeMs: 2000, // Fastest is 2 seconds
    baseUpgradeCost: 50,
    upgradeCostIncreaseFactor: 1.35,
  },
  {
    id: 'seasoned_captain',
    name: 'Seasoned Captain',
    description: 'Knows the ropes. Periodically hauls in a decent bounty.',
    icon: Ship,
    initialCost: 250,
    costIncreaseFactor: 1.2,
    baseCollectionAmount: 30, // Collects 30 fish
    baseCollectionTimeMs: 15000, // Base time 15 seconds for 1 unit
    minCollectionTimeMs: 4000,  // Fastest is 4 seconds
    baseUpgradeCost: 300,
    upgradeCostIncreaseFactor: 1.45,
  },
  {
    id: 'master_angler',
    name: 'Master Angler',
    description: 'A legend of the deep. Periodically lands a massive treasure.',
    icon: Briefcase,
    initialCost: 1200,
    costIncreaseFactor: 1.25,
    baseCollectionAmount: 150, // Collects 150 fish
    baseCollectionTimeMs: 30000, // Base time 30 seconds for 1 unit
    minCollectionTimeMs: 8000,  // Fastest is 8 seconds
    baseUpgradeCost: 1500,
    upgradeCostIncreaseFactor: 1.55,
  },
];

export interface GlobalUpgradeData {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  rateMultiplierIncrease?: number; // e.g., 0.1 for +10% to global collection amounts
  effects?: {
    boosterInitialChance?: number;
    boosterInitialDurationMs?: number;
    boosterSpawnIntervalMs?: number;
    boosterMaxFishMultiplier?: number;
    autoNetInitialCatchAmount?: number;
    autoNetIntervalMs?: number;
    marketAnalysisChance?: number;
    marketAnalysisDurationMs?: number;
    marketAnalysisMultiplier?: number;
  };
}

export const GLOBAL_UPGRADES_DATA: GlobalUpgradeData[] = [
  {
    id: 'sharper_hooks',
    name: 'Sharper Hooks',
    description: 'Improves fishing tool quality. All fishermen +10% fish collection amount.',
    icon: Settings2,
    cost: 100,
    rateMultiplierIncrease: 0.1,
  },
  {
    id: 'sonar_technology',
    name: 'Sonar Technology',
    description: 'Advanced fish finding. All fishermen +25% fish collection amount.',
    icon: Zap,
    cost: 500,
    rateMultiplierIncrease: 0.25,
  },
  {
    id: 'bigger_boats',
    name: 'Bigger Boats',
    description: 'Larger capacity for catches. All fishermen +50% fish collection amount.',
    icon: PackagePlusIcon,
    cost: 2000,
    rateMultiplierIncrease: 0.5,
  },
  {
    id: 'booster_bait',
    name: 'Booster Bait',
    description: 'Special bait that has a chance to trigger a fishing frenzy in the minigame!',
    icon: Flame,
    cost: 1500,
    effects: {
      boosterInitialChance: 0.005,
      boosterInitialDurationMs: 10000,
      boosterSpawnIntervalMs: 200,
      boosterMaxFishMultiplier: 2,
    }
  },
  {
    id: 'automated_trawling_net',
    name: 'Automated Trawling Net',
    description: 'Periodically, automatically catches fish from the minigame area.',
    icon: Anchor,
    cost: 2500,
    effects: {
      autoNetInitialCatchAmount: 1,
      autoNetIntervalMs: 15000,
    }
  },
  {
    id: 'market_analysis',
    name: 'Fish Market Analysis',
    description: 'Chance to predict market surges, temporarily doubling all fish income.',
    icon: BarChart3,
    cost: 5000,
    effects: {
      marketAnalysisChance: 0.01,
      marketAnalysisDurationMs: 15000,
      marketAnalysisMultiplier: 2,
    }
  }
];

export interface MinigameUpgradeEffect {
  type: 'maxFish' | 'lifetime' | 'value' | 'criticalChance' | 'spawnCooldownReduction' | 'boosterBaitChance' | 'boosterBaitDuration' | 'autoNetCatchAmount';
  value: number;
}
export interface MinigameUpgradeData {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  initialCost: number;
  costIncreaseFactor: number;
  effect: MinigameUpgradeEffect;
  maxLevel?: number;
  requiredGlobalUpgradeId?: string;
}

export const MINIGAME_UPGRADES_DATA: MinigameUpgradeData[] = [
  {
    id: 'increase_max_fish',
    name: 'More Crowded Waters',
    description: 'Increases the max number of fish that can appear in the minigame.',
    icon: UsersRound,
    initialCost: 300,
    costIncreaseFactor: 1.5,
    effect: { type: 'maxFish', value: 1 },
  },
  {
    id: 'increase_lifetime',
    name: 'Patient Fish',
    description: 'Increases how long fish stay on screen in the minigame.',
    icon: Timer,
    initialCost: 250,
    costIncreaseFactor: 1.4,
    effect: { type: 'lifetime', value: 500 },
  },
  {
    id: 'increase_value',
    name: 'Lucky Catch',
    description: 'Increases the number of fish awarded per click in the minigame.',
    icon: CircleDollarSign,
    initialCost: 400,
    costIncreaseFactor: 1.6,
    effect: { type: 'value', value: 1 },
  },
  {
    id: 'increase_critical_chance',
    name: 'Eagle Eye',
    description: 'Increases the chance of spotting valuable critical fish.',
    icon: Eye,
    initialCost: 600,
    costIncreaseFactor: 1.8,
    effect: { type: 'criticalChance', value: 0.002 },
    maxLevel: 50,
  },
  {
    id: 'decrease_spawn_cooldown',
    name: 'Fish Attractant',
    description: 'Reduces the time between fish appearances in the minigame.',
    icon: FastForward,
    initialCost: 450,
    costIncreaseFactor: 1.55,
    effect: { type: 'spawnCooldownReduction', value: 100 },
    maxLevel: 10,
  },
  {
    id: 'increase_booster_bait_chance',
    name: 'Potent Booster Bait',
    description: 'Increases the chance of Booster Bait activating.',
    icon: TrendingUp,
    initialCost: 500,
    costIncreaseFactor: 1.7,
    effect: { type: 'boosterBaitChance', value: 0.001 },
    requiredGlobalUpgradeId: 'booster_bait',
    maxLevel: 45,
  },
  {
    id: 'increase_booster_bait_duration',
    name: 'Extended Frenzy',
    description: 'Increases the duration of the Booster Bait effect.',
    icon: Clock3,
    initialCost: 750,
    costIncreaseFactor: 1.6,
    effect: { type: 'boosterBaitDuration', value: 1000 },
    requiredGlobalUpgradeId: 'booster_bait',
  },
  {
    id: 'increase_autonet_catch_amount',
    name: 'Net Efficiency',
    description: 'Increases the number of fish caught by the Automated Trawling Net.',
    icon: Wrench,
    initialCost: 1000,
    costIncreaseFactor: 1.9,
    effect: { type: 'autoNetCatchAmount', value: 1 },
    requiredGlobalUpgradeId: 'automated_trawling_net',
  }
];


export const INITIAL_FISH_COUNT = 20;
export const GAME_TICK_INTERVAL_MS = 200; // Check for collections more frequently

// Initial values for minigame parameters
export const INITIAL_MINIGAME_MAX_FISH = 5;
export const INITIAL_MINIGAME_FISH_LIFETIME_MS = 8000;
export const INITIAL_MINIGAME_FISH_VALUE = 1;
export const INITIAL_CRITICAL_FISH_CHANCE = 0.01; // 1%
export const MINIGAME_CRITICAL_FISH_MIN_MULTIPLIER = 10;
export const MINIGAME_CRITICAL_FISH_MAX_MULTIPLIER = 30;

export const INITIAL_MIN_SPAWN_INTERVAL_MS = 1000;
export const INITIAL_MAX_SPAWN_INTERVAL_MS = 2000;
export const MIN_POSSIBLE_SPAWN_INTERVAL_MS = 150; // Absolute minimum spawn interval

// For Automated Trawling Net, if not defined in global upgrade for some reason
export const DEFAULT_AUTO_NET_CATCH_AMOUNT = 1;
export const DEFAULT_AUTO_NET_INTERVAL_MS = 15000;

// For Booster Bait, if not defined in global upgrade
export const DEFAULT_BOOSTER_BAIT_CHANCE = 0.005;
export const DEFAULT_BOOSTER_BAIT_DURATION_MS = 10000;
export const DEFAULT_BOOSTER_SPAWN_INTERVAL_MS = 200;
export const DEFAULT_BOOSTER_MAX_FISH_MULTIPLIER = 2;

// For Market Analysis, if not defined in global upgrade
export const DEFAULT_MARKET_ANALYSIS_CHANCE = 0.01; // Per second
export const DEFAULT_MARKET_ANALYSIS_DURATION_MS = 15000;
export const DEFAULT_MARKET_ANALYSIS_MULTIPLIER = 2;

export const MAX_OFFLINE_PROGRESS_MS = 8 * 60 * 60 * 1000; // 8 hours
