
"use client";

import type React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChartHorizontalBig, Users, Ship, Briefcase, Settings2, Zap, PackagePlusIcon, Flame, Anchor, BarChart3, FishIcon, TrendingUp, Percent, Clock, Maximize, Hourglass, Crosshair, ChevronsRight, ChevronsLeft, HelpCircle } from 'lucide-react';
import type { FishermanType, GlobalUpgradeData } from '@/config/gameData';

interface FishermanTypeState {
  quantity: number;
  level: number;
}

interface CurrentMinigameParams {
  maxFish: number;
  minSpawnMs: number;
  maxSpawnMs: number;
  lifetime: number;
  value: number;
  critChance: number;
}

interface BaseMinigameStats {
  maxFish: number;
  lifetime: number;
  value: number;
  critChance: number;
  minSpawnMs: number;
  maxSpawnMs: number;
}

interface GameConfigData {
    INITIAL_MINIGAME_MAX_FISH: number;
    INITIAL_MINIGAME_FISH_LIFETIME_MS: number;
    INITIAL_MINIGAME_FISH_VALUE: number;
    INITIAL_CRITICAL_FISH_CHANCE: number;
    INITIAL_MIN_SPAWN_INTERVAL_MS: number;
    INITIAL_MAX_SPAWN_INTERVAL_MS: number;
    DEFAULT_BOOSTER_BAIT_CHANCE: number;
    DEFAULT_BOOSTER_BAIT_DURATION_MS: number;
    DEFAULT_BOOSTER_SPAWN_INTERVAL_MS: number;
    DEFAULT_BOOSTER_MAX_FISH_MULTIPLIER: number;
    DEFAULT_AUTO_NET_CATCH_AMOUNT: number;
    DEFAULT_AUTO_NET_INTERVAL_MS: number;
    DEFAULT_MARKET_ANALYSIS_CHANCE: number;
    DEFAULT_MARKET_ANALYSIS_DURATION_MS: number;
    DEFAULT_MARKET_ANALYSIS_MULTIPLIER: number;
}

interface GameStatisticsModalProps {
  totalFish: number;
  totalFishPerSecond: number;
  ownedFishermanTypes: Record<string, FishermanTypeState>;
  fishermanTypesData: FishermanType[];
  globalRateMultiplier: number; // Base multiplier without market surge
  effectiveGlobalRateMultiplier: number; // Multiplier including market surge
  currentMinigameParams: CurrentMinigameParams;
  baseMinigameStats: BaseMinigameStats;
  isBoosterActive: boolean;
  boosterEndTime: number | null;
  purchasedUpgrades: Record<string, boolean>;
  boosterBaitGlobalUpgrade?: GlobalUpgradeData;
  effectiveBoosterBaitChance: number;
  effectiveBoosterBaitDurationMs: number;
  autoNetGlobalUpgrade?: GlobalUpgradeData;
  autoNetCatchAmount: number;
  autoNetBaseInterval: number;
  isMarketAnalysisActive: boolean;
  marketAnalysisEndTime: number | null;
  marketAnalysisGlobalUpgrade?: GlobalUpgradeData;
  gameConfigData: GameConfigData;
}

const StatItem: React.FC<{ icon?: React.ElementType; label: string; value: string | number; unit?: string; description?: string }> = ({ icon: Icon, label, value, unit, description }) => (
  <div className="flex flex-col p-2 border-b border-border/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {Icon && <Icon className="h-4 w-4 mr-2 text-primary" />}
        <span className="font-medium">{label}:</span>
      </div>
      <span className="text-right font-semibold">
        {typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
      </span>
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
  </div>
);

const formatTimeRemaining = (endTime: number | null): string => {
  if (endTime === null) return 'N/A';
  const remainingMs = Math.max(0, endTime - Date.now());
  if (remainingMs === 0) return 'Expired';
  return `${(remainingMs / 1000).toFixed(1)}s`;
};

export function GameStatisticsModal({
  totalFish,
  totalFishPerSecond,
  ownedFishermanTypes,
  fishermanTypesData,
  globalRateMultiplier,
  effectiveGlobalRateMultiplier,
  currentMinigameParams,
  baseMinigameStats,
  isBoosterActive,
  boosterEndTime,
  purchasedUpgrades,
  boosterBaitGlobalUpgrade,
  effectiveBoosterBaitChance,
  effectiveBoosterBaitDurationMs,
  autoNetGlobalUpgrade,
  autoNetCatchAmount,
  autoNetBaseInterval,
  isMarketAnalysisActive,
  marketAnalysisEndTime,
  marketAnalysisGlobalUpgrade,
  gameConfigData,
}: GameStatisticsModalProps) {
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChartHorizontalBig className="mr-2 h-4 w-4" /> Show Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Game Statistics</DialogTitle>
          <DialogDescription>
            A complete overview of your fishing empire's current status.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-1 pr-3">
          <div className="space-y-6">
            
            {/* Overall Stats */}
            <section>
              <h3 className="text-xl font-semibold mb-2 text-primary flex items-center"><FishIcon className="mr-2" />Overall</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-card p-3 rounded-md shadow-sm">
                <StatItem icon={FishIcon} label="Total Fish" value={totalFish} />
                <StatItem icon={TrendingUp} label="Total Fish/sec" value={totalFishPerSecond.toFixed(2)} unit="FPS" />
                 <StatItem icon={HelpCircle} label="Global Rate Multiplier" value={`${((effectiveGlobalRateMultiplier -1)*100).toFixed(0)}% Bonus`} description={`Base rate: ${((globalRateMultiplier-1)*100).toFixed(0)}% Bonus, Market Surge: ${isMarketAnalysisActive ? `x${marketAnalysisGlobalUpgrade?.effects?.marketAnalysisMultiplier ?? 1}` : 'Inactive'}`} />
              </div>
            </section>

            {/* Crew Breakdown */}
            <section>
              <h3 className="text-xl font-semibold mb-2 text-primary flex items-center"><Users className="mr-2" />Crew Breakdown</h3>
              <div className="space-y-3">
                {fishermanTypesData.map(ft => {
                  const state = ownedFishermanTypes[ft.id] || { quantity: 0, level: 1 };
                  const crewRatePerUnit = ft.baseRate * state.level * effectiveGlobalRateMultiplier;
                  const totalCrewRate = crewRatePerUnit * state.quantity;
                  const IconComp = ft.icon;
                  return (
                    <div key={ft.id} className="bg-card p-3 rounded-md shadow-sm">
                      <h4 className="font-semibold text-lg mb-1 flex items-center"><IconComp className="mr-2 h-5 w-5" />{ft.name}</h4>
                      <StatItem label="Quantity" value={state.quantity} />
                      <StatItem label="Level" value={state.level} />
                      <StatItem label="Fish/sec per unit" value={crewRatePerUnit.toFixed(2)} />
                      <StatItem label="Total Fish/sec for type" value={totalCrewRate.toFixed(2)} />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Minigame Stats */}
            <section>
              <h3 className="text-xl font-semibold mb-2 text-primary flex items-center"><Crosshair className="mr-2" />Minigame Stats</h3>
              <div className="bg-card p-3 rounded-md shadow-sm space-y-2">
                 <h4 className="font-semibold text-md mb-1">Current Effective (Includes Boosters)</h4>
                <StatItem icon={Maximize} label="Max Fish on Screen" value={currentMinigameParams.maxFish} />
                <StatItem icon={Hourglass} label="Fish Lifetime" value={(currentMinigameParams.lifetime / 1000).toFixed(1)} unit="sec" />
                <StatItem icon={FishIcon} label="Base Value per Click" value={currentMinigameParams.value} />
                <StatItem icon={Percent} label="Critical Fish Chance" value={(currentMinigameParams.critChance * 100).toFixed(1)} unit="%" />
                <StatItem icon={Clock} label="Spawn Interval" value={`${(currentMinigameParams.minSpawnMs / 1000).toFixed(1)} - ${(currentMinigameParams.maxSpawnMs / 1000).toFixed(1)}`} unit="sec" />

                <h4 className="font-semibold text-md mb-1 pt-2 border-t border-border/30">Base Unbuffed</h4>
                <StatItem icon={Maximize} label="Max Fish on Screen" value={baseMinigameStats.maxFish} />
                <StatItem icon={Hourglass} label="Fish Lifetime" value={(baseMinigameStats.lifetime / 1000).toFixed(1)} unit="sec" />
                <StatItem icon={FishIcon} label="Base Value per Click" value={baseMinigameStats.value} />
                <StatItem icon={Percent} label="Critical Fish Chance" value={(baseMinigameStats.critChance * 100).toFixed(1)} unit="%" />
                <StatItem icon={Clock} label="Spawn Interval" value={`${(baseMinigameStats.minSpawnMs / 1000).toFixed(1)} - ${(baseMinigameStats.maxSpawnMs / 1000).toFixed(1)}`} unit="sec" />
              </div>
            </section>

            {/* Global Effects */}
            <section>
              <h3 className="text-xl font-semibold mb-2 text-primary flex items-center"><Settings2 className="mr-2" />Global Effects</h3>
              <div className="space-y-3">
                {/* Booster Bait */}
                {purchasedUpgrades['booster_bait'] && boosterBaitGlobalUpgrade && (
                  <div className="bg-card p-3 rounded-md shadow-sm">
                    <h4 className="font-semibold text-lg mb-1 flex items-center"><Flame className="mr-2 h-5 w-5" />Booster Bait</h4>
                    <StatItem label="Status" value={isBoosterActive ? `Active (${formatTimeRemaining(boosterEndTime)} left)` : "Inactive"} />
                    <StatItem label="Activation Chance" value={(effectiveBoosterBaitChance * 100).toFixed(2)} unit="%" />
                    <StatItem label="Duration" value={(effectiveBoosterBaitDurationMs / 1000).toFixed(1)} unit="sec" />
                    <StatItem label="Effect: Spawn Interval" value={(boosterBaitGlobalUpgrade.effects?.boosterSpawnIntervalMs ?? gameConfigData.DEFAULT_BOOSTER_SPAWN_INTERVAL_MS) / 1000} unit="sec" />
                    <StatItem label="Effect: Max Fish Multiplier" value={`x${boosterBaitGlobalUpgrade.effects?.boosterMaxFishMultiplier ?? gameConfigData.DEFAULT_BOOSTER_MAX_FISH_MULTIPLIER}`} />
                  </div>
                )}

                {/* Automated Trawling Net */}
                {purchasedUpgrades['automated_trawling_net'] && autoNetGlobalUpgrade && (
                  <div className="bg-card p-3 rounded-md shadow-sm">
                    <h4 className="font-semibold text-lg mb-1 flex items-center"><Anchor className="mr-2 h-5 w-5" />Automated Trawling Net</h4>
                     <StatItem label="Status" value="Active" />
                    <StatItem label="Fish Caught per Haul" value={autoNetCatchAmount} />
                    <StatItem label="Interval" value={(autoNetBaseInterval / 1000).toFixed(1)} unit="sec" />
                    <StatItem label="Value per Haul" value={autoNetCatchAmount * currentMinigameParams.value} unit="fish" />
                  </div>
                )}

                {/* Market Analysis */}
                {purchasedUpgrades['market_analysis'] && marketAnalysisGlobalUpgrade && (
                  <div className="bg-card p-3 rounded-md shadow-sm">
                    <h4 className="font-semibold text-lg mb-1 flex items-center"><BarChart3 className="mr-2 h-5 w-5" />Market Analysis</h4>
                    <StatItem label="Status" value={isMarketAnalysisActive ? `Active (${formatTimeRemaining(marketAnalysisEndTime)} left)` : "Inactive"} />
                    <StatItem label="Activation Chance" value={`${((marketAnalysisGlobalUpgrade.effects?.marketAnalysisChance ?? gameConfigData.DEFAULT_MARKET_ANALYSIS_CHANCE) * 100).toFixed(1)}%`} unit="per sec" />
                    <StatItem label="Duration" value={((marketAnalysisGlobalUpgrade.effects?.marketAnalysisDurationMs ?? gameConfigData.DEFAULT_MARKET_ANALYSIS_DURATION_MS) / 1000).toFixed(1)} unit="sec" />
                    <StatItem label="Income Multiplier" value={`x${marketAnalysisGlobalUpgrade.effects?.marketAnalysisMultiplier ?? gameConfigData.DEFAULT_MARKET_ANALYSIS_MULTIPLIER}`} />
                  </div>
                )}
                 {!purchasedUpgrades['booster_bait'] && !purchasedUpgrades['automated_trawling_net'] && !purchasedUpgrades['market_analysis'] && (
                  <p className="text-muted-foreground text-sm">No special global effects purchased or active yet.</p>
                )}
              </div>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    
