import type React from 'react';
import { Users, Ship, TrendingUp, Zap, PackagePlusIcon, Briefcase, Settings2 } from 'lucide-react';

// Using React.ElementType for Lucide icons
export interface FishermanType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  initialCost: number;
  costIncreaseFactor: number;
  baseRate: number; // fish per second at level 1
  baseUpgradeCost: number; // cost to upgrade from L1 to L2
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
    baseRate: 0.1,
    baseUpgradeCost: 25,
    upgradeCostIncreaseFactor: 1.3,
  },
  {
    id: 'seasoned_captain',
    name: 'Seasoned Captain',
    description: 'Knows the best spots and techniques. Hauls in a good catch.',
    icon: Ship,
    initialCost: 200,
    costIncreaseFactor: 1.2,
    baseRate: 1,
    baseUpgradeCost: 250,
    upgradeCostIncreaseFactor: 1.4,
  },
  {
    id: 'master_angler',
    name: 'Master Angler',
    description: 'A legend of the deep. Fish practically jump into the boat!',
    icon: Briefcase, 
    initialCost: 1000,
    costIncreaseFactor: 1.25,
    baseRate: 5,
    baseUpgradeCost: 1200,
    upgradeCostIncreaseFactor: 1.5,
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

export const INITIAL_FISH_COUNT = 10;
export const GAME_TICK_INTERVAL_MS = 1000; // 1 second
