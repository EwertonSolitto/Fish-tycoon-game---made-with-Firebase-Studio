
import type React from 'react';
import { Users, Ship, Briefcase, Settings2, Zap, PackagePlusIcon, UsersRound, Timer, CircleDollarSign } from 'lucide-react';

// Using React.ElementType for Lucide icons
export interface FishermanType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  initialCost: number;
  costIncreaseFactor: number;
  baseRate: number; // fish per second at level 1
  baseUpgradeCost: number; // cost to upgrade the entire crew of this type from L1 to L2
  upgradeCostIncreaseFactor: number;
}

export const FISHERMAN_TYPES: FishermanType[] = [
  {
    id: 'novice_fisher',
    name: 'Novice Fisher',
    description: 'A beginner at sea, eager to learn. Catches a few fish.',
    icon: Users,
    initialCost: 20,
    costIncreaseFactor: 1.15,
    baseRate: 1,
    baseUpgradeCost: 50, // Cost to upgrade entire Novice Fisher crew from L1 to L2
    upgradeCostIncreaseFactor: 1.35,
  },
  {
    id: 'seasoned_captain',
    name: 'Seasoned Captain',
    description: 'Knows the best spots and techniques. Hauls in a good catch.',
    icon: Ship,
    initialCost: 200,
    costIncreaseFactor: 1.2,
    baseRate: 5, // Increased base rate
    baseUpgradeCost: 300, // Cost to upgrade entire Seasoned Captain crew from L1 to L2
    upgradeCostIncreaseFactor: 1.45,
  },
  {
    id: 'master_angler',
    name: 'Master Angler',
    description: 'A legend of the deep. Fish practically jump into the boat!',
    icon: Briefcase, 
    initialCost: 1000,
    costIncreaseFactor: 1.25,
    baseRate: 25, // Increased base rate
    baseUpgradeCost: 1500, // Cost to upgrade entire Master Angler crew from L1 to L2
    upgradeCostIncreaseFactor: 1.55,
  },
];

export interface GlobalUpgradeData {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  rateMultiplierIncrease: number; // e.g., 0.1 for +10% to global rate
}

export const GLOBAL_UPGRADES_DATA: GlobalUpgradeData[] = [
  {
    id: 'sharper_hooks',
    name: 'Sharper Hooks',
    description: 'Improves fishing tool quality. All fishermen +10% fish rate.',
    icon: Settings2, 
    cost: 100,
    rateMultiplierIncrease: 0.1,
  },
  {
    id: 'sonar_technology',
    name: 'Sonar Technology',
    description: 'Advanced fish finding. All fishermen +25% fish rate.',
    icon: Zap,
    cost: 500,
    rateMultiplierIncrease: 0.25,
  },
  {
    id: 'bigger_boats',
    name: 'Bigger Boats',
    description: 'Larger capacity for catches. All fishermen +50% fish rate.',
    icon: PackagePlusIcon,
    cost: 2000,
    rateMultiplierIncrease: 0.5,
  },
];

export interface MinigameUpgradeEffect {
  type: 'maxFish' | 'lifetime' | 'value';
  value: number;
}
export interface MinigameUpgradeData {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  effect: MinigameUpgradeEffect;
}

export const MINIGAME_UPGRADES_DATA: MinigameUpgradeData[] = [
  {
    id: 'increase_max_fish_1',
    name: 'More Crowded Waters',
    description: 'Allows up to 2 more fish to appear in the minigame.',
    icon: UsersRound,
    cost: 300,
    effect: { type: 'maxFish', value: 2 },
  },
  {
    id: 'increase_lifetime_1',
    name: 'Patient Fish',
    description: 'Minigame fish stay on screen for 2 seconds longer.',
    icon: Timer,
    cost: 250,
    effect: { type: 'lifetime', value: 2000 }, // 2000ms = 2 seconds
  },
  {
    id: 'increase_value_1',
    name: 'Lucky Catch',
    description: 'Each fish caught in the minigame is now worth +1 more fish.',
    icon: CircleDollarSign,
    cost: 400,
    effect: { type: 'value', value: 1 },
  },
];


export const INITIAL_FISH_COUNT = 20;
export const GAME_TICK_INTERVAL_MS = 1000; // 1 second

// Initial values for minigame parameters
export const INITIAL_MINIGAME_MAX_FISH = 5;
export const INITIAL_MINIGAME_FISH_LIFETIME_MS = 8000;
export const INITIAL_MINIGAME_FISH_VALUE = 1;
