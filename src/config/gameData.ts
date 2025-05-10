
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
  baseCollectionAmount: number; // fish collected per cycle at level 1, before level-based duplication
  baseCollectionTimeMs: number; // time in MS for one unit to complete a cycle (before quantity scaling)
  minCollectionTimeMs: number; // minimum possible collection time for this type (respects GLOBAL_MIN_COLLECTION_TIME_MS)
  baseUpgradeCost: number; // cost to upgrade the entire crew of this type from L1 to L2
  upgradeCostIncreaseFactor: number; // Factor by which upgrade cost increases. Now >= 2.0 for duplication effect.
}

export const FISHERMAN_TYPES: FishermanType[] = [
  {
    id: 'novice_fisher',
    name: 'Novice Fisher',
    description: 'A beginner at sea. Periodically brings in a small catch.',
    icon: Users,
    initialCost: 20,
    costIncreaseFactor: 1.15,
    baseCollectionAmount: 5, 
    baseCollectionTimeMs: 8000, 
    minCollectionTimeMs: 2000, 
    baseUpgradeCost: 50,
    upgradeCostIncreaseFactor: 2.0, // Upgrading doubles base collection effect
  },
  {
    id: 'seasoned_captain',
    name: 'Seasoned Captain',
    description: 'Knows the ropes. Periodically hauls in a decent bounty.',
    icon: Ship,
    initialCost: 250,
    costIncreaseFactor: 1.2,
    baseCollectionAmount: 30, 
    baseCollectionTimeMs: 15000, 
    minCollectionTimeMs: 4000,  
    baseUpgradeCost: 300,
    upgradeCostIncreaseFactor: 2.1, // Upgrading doubles base collection effect
  },
  {
    id: 'master_angler',
    name: 'Master Angler',
    description: 'A legend of the deep. Periodically lands a massive treasure.',
    icon: Briefcase,
    initialCost: 1200,
    costIncreaseFactor: 1.25,
    baseCollectionAmount: 150,
    baseCollectionTimeMs: 30000, 
    minCollectionTimeMs: 8000,  
    baseUpgradeCost: 1500,
    upgradeCostIncreaseFactor: 2.2, // Upgrading doubles base collection effect
  },
];

export interface GlobalUpgradeData {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  rateMultiplierIncrease?: number; // e.g., 0.1 for +10% to global collection amounts (multiplicative)
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
      boosterInitialChance: 0.005, // Initial chance when this global upgrade is bought
      boosterInitialDurationMs: 10000, // Initial duration
      boosterSpawnIntervalMs: 200, // Frenzy spawn rate
      boosterMaxFishMultiplier: 2, // Frenzy max fish multiplier
    }
  },
  {
    id: 'automated_trawling_net',
    name: 'Automated Trawling Net',
    description: 'Periodically, automatically catches fish from the minigame area.',
    icon: Anchor,
    cost: 2500,
    effects: {
      autoNetInitialCatchAmount: 1, // Initial catch amount
      autoNetIntervalMs: 15000, // Base interval
    }
  },
  {
    id: 'market_analysis',
    name: 'Fish Market Analysis',
    description: 'Chance to predict market surges, temporarily doubling all fish income.',
    icon: BarChart3,
    cost: 5000,
    effects: {
      marketAnalysisChance: 0.01, // Per second
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
    effect: { type: 'lifetime', value: 500 }, // 0.5 seconds
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
    effect: { type: 'criticalChance', value: 0.002 }, // +0.2%
    maxLevel: 50, // Max 10% additional from upgrades (total 11% with base)
  },
  {
    id: 'decrease_spawn_cooldown',
    name: 'Fish Attractant',
    description: 'Reduces the time between fish appearances in the minigame.',
    icon: FastForward,
    initialCost: 450,
    costIncreaseFactor: 1.55,
    effect: { type: 'spawnCooldownReduction', value: 100 }, // -0.1s reduction (affects min/max equally)
    maxLevel: 10, // Max 1 second reduction
  },
  {
    id: 'increase_booster_bait_chance',
    name: 'Potent Booster Bait',
    description: 'Increases the chance of Booster Bait activating.',
    icon: TrendingUp,
    initialCost: 500,
    costIncreaseFactor: 1.7,
    effect: { type: 'boosterBaitChance', value: 0.001 }, // +0.1%
    requiredGlobalUpgradeId: 'booster_bait',
    maxLevel: 45, // Max +4.5% (total 5% with base if base is 0.5%)
  },
  {
    id: 'increase_booster_bait_duration',
    name: 'Extended Frenzy',
    description: 'Increases the duration of the Booster Bait effect.',
    icon: Clock3,
    initialCost: 750,
    costIncreaseFactor: 1.6,
    effect: { type: 'boosterBaitDuration', value: 1000 }, // +1 second
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
export const GAME_TICK_INTERVAL_MS = 200; 
export const GLOBAL_MIN_COLLECTION_TIME_MS = 100; // Absolute minimum collection time for any crew (0.1 seconds)

// Initial values for minigame parameters
export const INITIAL_MINIGAME_MAX_FISH = 5;
export const INITIAL_MINIGAME_FISH_LIFETIME_MS = 8000;
export const INITIAL_MINIGAME_FISH_VALUE = 1;
export const INITIAL_CRITICAL_FISH_CHANCE = 0.01; // 1%
export const MINIGAME_CRITICAL_FISH_MIN_MULTIPLIER = 10; // 1000%
export const MINIGAME_CRITICAL_FISH_MAX_MULTIPLIER = 30; // 3000%

export const INITIAL_MIN_SPAWN_INTERVAL_MS = 1000;
export const INITIAL_MAX_SPAWN_INTERVAL_MS = 2000;
export const MIN_POSSIBLE_SPAWN_INTERVAL_MS = 150; // Min spawn interval the game can reach through upgrades

// For Automated Trawling Net, default values if not specified in global upgrade
export const DEFAULT_AUTO_NET_CATCH_AMOUNT = 1;
export const DEFAULT_AUTO_NET_INTERVAL_MS = 15000;

// For Booster Bait, default values if not specified in global upgrade
export const DEFAULT_BOOSTER_BAIT_CHANCE = 0.005;
export const DEFAULT_BOOSTER_BAIT_DURATION_MS = 10000;
export const DEFAULT_BOOSTER_SPAWN_INTERVAL_MS = 200;
export const DEFAULT_BOOSTER_MAX_FISH_MULTIPLIER = 2;

// For Market Analysis, default values if not specified in global upgrade
export const DEFAULT_MARKET_ANALYSIS_CHANCE = 0.01; // Per second
export const DEFAULT_MARKET_ANALYSIS_DURATION_MS = 15000;
export const DEFAULT_MARKET_ANALYSIS_MULTIPLIER = 2;

export const MAX_OFFLINE_PROGRESS_MS = 8 * 60 * 60 * 1000; // 8 hours
