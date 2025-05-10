
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { FishermanType, GlobalUpgradeData } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FishDisplay } from '@/components/game/FishDisplay';
import { HireableFishermanCard } from '@/components/game/HireableFishermanCard';
import { PurchasableUpgradeCard } from '@/components/game/PurchasableUpgradeCard';
import { MinigameUpgradeCard } from '@/components/game/MinigameUpgradeCard';
import { GameStatisticsModal } from '@/components/game/GameStatisticsModal';
import { 
  FISHERMAN_TYPES, 
  GLOBAL_UPGRADES_DATA, 
  MINIGAME_UPGRADES_DATA,
  INITIAL_FISH_COUNT, 
  GAME_TICK_INTERVAL_MS,
  INITIAL_MINIGAME_MAX_FISH,
  INITIAL_MINIGAME_FISH_LIFETIME_MS,
  INITIAL_MINIGAME_FISH_VALUE,
  INITIAL_CRITICAL_FISH_CHANCE,
  INITIAL_MIN_SPAWN_INTERVAL_MS,
  INITIAL_MAX_SPAWN_INTERVAL_MS,
  MIN_POSSIBLE_SPAWN_INTERVAL_MS,
  DEFAULT_BOOSTER_BAIT_CHANCE,
  DEFAULT_BOOSTER_BAIT_DURATION_MS,
  DEFAULT_BOOSTER_SPAWN_INTERVAL_MS,
  DEFAULT_BOOSTER_MAX_FISH_MULTIPLIER,
  DEFAULT_AUTO_NET_CATCH_AMOUNT,
  DEFAULT_AUTO_NET_INTERVAL_MS,
  DEFAULT_MARKET_ANALYSIS_CHANCE,
  DEFAULT_MARKET_ANALYSIS_DURATION_MS,
  DEFAULT_MARKET_ANALYSIS_MULTIPLIER,
  MAX_OFFLINE_PROGRESS_MS,
} from '@/config/gameData';
import { RotateCcw } from 'lucide-react';
import { ClickableFishGame } from '@/components/game/ClickableFishGame';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LOCAL_STORAGE_KEY = 'fishWorldTycoonSaveData_v3'; // Incremented version for new structure

interface FishermanTypeState {
  quantity: number;
  level: number;
  currentCrewUpgradeCost: number; 
}

interface FishermanTimerState {
  nextCollectionTimestamp: number;
  currentIntervalMs: number;
}

interface SavedGameState {
  fish: number;
  ownedFishermanTypes: Record<string, FishermanTypeState>;
  purchasedUpgrades: Record<string, boolean>;
  globalRateMultiplier: number;
  nextFishermanCosts: Record<string, number>;
  
  minigameMaxFish: number;
  minigameFishLifetime: number;
  minigameFishValue: number;
  minigameUpgradeLevels: Record<string, number>;
  nextMinigameUpgradeCosts: Record<string, number>;

  criticalFishChance: number;
  minigameMinSpawnMs: number;
  minigameMaxSpawnMs: number;

  boosterBaitAdditionalChance: number;
  boosterBaitAdditionalDurationMs: number;

  autoNetCatchAmount: number;

  fishermanTimers: Record<string, FishermanTimerState>;
  lastSaveTimestamp: number;
}

export default function FishWorldTycoonPage() {
  const [fish, setFish] = useState<number>(INITIAL_FISH_COUNT);
  const [ownedFishermanTypes, setOwnedFishermanTypes] = useState<Record<string, FishermanTypeState>>({});
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, boolean>>({});
  const [globalRateMultiplier, setGlobalRateMultiplier] = useState<number>(1);
  const [nextFishermanCosts, setNextFishermanCosts] = useState<Record<string, number>>({});

  const [minigameMaxFish, setMinigameMaxFish] = useState<number>(INITIAL_MINIGAME_MAX_FISH);
  const [minigameFishLifetime, setMinigameFishLifetime] = useState<number>(INITIAL_MINIGAME_FISH_LIFETIME_MS);
  const [minigameFishValue, setMinigameFishValue] = useState<number>(INITIAL_MINIGAME_FISH_VALUE);
  const [minigameUpgradeLevels, setMinigameUpgradeLevels] = useState<Record<string, number>>({});
  const [nextMinigameUpgradeCosts, setNextMinigameUpgradeCosts] = useState<Record<string, number>>({});

  const [criticalFishChance, setCriticalFishChance] = useState<number>(INITIAL_CRITICAL_FISH_CHANCE);
  const [minigameMinSpawnMs, setMinigameMinSpawnMs] = useState<number>(INITIAL_MIN_SPAWN_INTERVAL_MS);
  const [minigameMaxSpawnMs, setMinigameMaxSpawnMs] = useState<number>(INITIAL_MAX_SPAWN_INTERVAL_MS);

  const [boosterBaitAdditionalChance, setBoosterBaitAdditionalChance] = useState<number>(0);
  const [boosterBaitAdditionalDurationMs, setBoosterBaitAdditionalDurationMs] = useState<number>(0);
  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(false);
  const [boosterEndTime, setBoosterEndTime] = useState<number | null>(null);
  const boosterBaitGlobalUpgrade = useMemo(() => GLOBAL_UPGRADES_DATA.find(up => up.id === 'booster_bait'), []);

  const [autoNetCatchAmount, setAutoNetCatchAmount] = useState<number>(DEFAULT_AUTO_NET_CATCH_AMOUNT);
  const autoNetGlobalUpgrade = useMemo(() => GLOBAL_UPGRADES_DATA.find(up => up.id === 'automated_trawling_net'), []);
  const autoNetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isMarketAnalysisActive, setIsMarketAnalysisActive] = useState<boolean>(false);
  const [marketAnalysisEndTime, setMarketAnalysisEndTime] = useState<number | null>(null);
  const marketAnalysisGlobalUpgrade = useMemo(() => GLOBAL_UPGRADES_DATA.find(up => up.id === 'market_analysis'), []);

  const [fishermanTimers, setFishermanTimers] = useState<Record<string, FishermanTimerState>>({});

  const { toast } = useToast();

  const effectiveGlobalRateMultiplier = useMemo(() => {
    return globalRateMultiplier * (isMarketAnalysisActive ? (marketAnalysisGlobalUpgrade?.effects?.marketAnalysisMultiplier ?? 1) : 1);
  }, [globalRateMultiplier, isMarketAnalysisActive, marketAnalysisGlobalUpgrade]);

  const calculateFishermanInterval = useCallback((type: FishermanType, quantity: number): number => {
    if (quantity === 0) return Infinity;
    return Math.max(type.baseCollectionTimeMs / quantity, type.minCollectionTimeMs);
  }, []);

  const initializeGameState = useCallback((forceReset = false) => {
    let loadedState: SavedGameState | null = null;
    if (typeof window !== 'undefined' && !forceReset) {
      try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
          loadedState = JSON.parse(savedData) as SavedGameState;
        }
      } catch (error) {
        console.error("Failed to load game state from localStorage:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); 
      }
    }

    let offlineFishGains = 0;
    if (loadedState && loadedState.lastSaveTimestamp && loadedState.ownedFishermanTypes && loadedState.fishermanTimers) {
        const timePassedSinceLastSaveMs = Date.now() - loadedState.lastSaveTimestamp;
        const effectiveOfflineMs = Math.min(timePassedSinceLastSaveMs, MAX_OFFLINE_PROGRESS_MS);

        for (const typeId in loadedState.ownedFishermanTypes) {
            const typeData = FISHERMAN_TYPES.find(f => f.id === typeId);
            const ownedTypeState = loadedState.ownedFishermanTypes[typeId];
            const timerInfo = loadedState.fishermanTimers[typeId];

            if (typeData && ownedTypeState && ownedTypeState.quantity > 0 && timerInfo && timerInfo.currentIntervalMs > 0 && timerInfo.currentIntervalMs !== Infinity) {
                const collectionsMissed = Math.floor(effectiveOfflineMs / timerInfo.currentIntervalMs);
                if (collectionsMissed > 0) {
                    const fishPerCollection = typeData.baseCollectionAmount * 
                                              ownedTypeState.level * 
                                              (loadedState.globalRateMultiplier ?? 1);
                    offlineFishGains += collectionsMissed * fishPerCollection;
                }
            }
        }
    }
    
    if (loadedState) {
      setFish((loadedState.fish ?? INITIAL_FISH_COUNT) + offlineFishGains);
      if (offlineFishGains > 0) {
        toast({ title: "Welcome Back!", description: `You gathered ${Math.floor(offlineFishGains)} fish while away!`, variant: 'default' });
      }
      setPurchasedUpgrades(loadedState.purchasedUpgrades ?? {});
      setGlobalRateMultiplier(loadedState.globalRateMultiplier ?? 1);
      
      setMinigameMaxFish(loadedState.minigameMaxFish ?? INITIAL_MINIGAME_MAX_FISH);
      setMinigameFishLifetime(loadedState.minigameFishLifetime ?? INITIAL_MINIGAME_FISH_LIFETIME_MS);
      setMinigameFishValue(loadedState.minigameFishValue ?? INITIAL_MINIGAME_FISH_VALUE);

      setCriticalFishChance(loadedState.criticalFishChance ?? INITIAL_CRITICAL_FISH_CHANCE);
      setMinigameMinSpawnMs(loadedState.minigameMinSpawnMs ?? INITIAL_MIN_SPAWN_INTERVAL_MS);
      setMinigameMaxSpawnMs(loadedState.minigameMaxSpawnMs ?? INITIAL_MAX_SPAWN_INTERVAL_MS);
      
      setBoosterBaitAdditionalChance(loadedState.boosterBaitAdditionalChance ?? 0);
      setBoosterBaitAdditionalDurationMs(loadedState.boosterBaitAdditionalDurationMs ?? 0);
      setAutoNetCatchAmount(loadedState.autoNetCatchAmount ?? (autoNetGlobalUpgrade?.effects?.autoNetInitialCatchAmount || DEFAULT_AUTO_NET_CATCH_AMOUNT));


      const defaultFishermanCosts: Record<string, number> = {};
      const defaultOwnedFishermanTypes: Record<string, FishermanTypeState> = {};
      FISHERMAN_TYPES.forEach(ft => {
        defaultFishermanCosts[ft.id] = ft.initialCost;
        defaultOwnedFishermanTypes[ft.id] = { quantity: 0, level: 1, currentCrewUpgradeCost: ft.baseUpgradeCost };
      });
      setNextFishermanCosts(loadedState.nextFishermanCosts ?? defaultFishermanCosts);
      const loadedOwnedTypes = loadedState.ownedFishermanTypes ?? defaultOwnedFishermanTypes;
      setOwnedFishermanTypes(loadedOwnedTypes);
      
      const initialTimers: Record<string, FishermanTimerState> = {};
      if (loadedState.ownedFishermanTypes && loadedState.fishermanTimers && loadedState.lastSaveTimestamp) {
        for (const typeId in loadedState.ownedFishermanTypes) {
            const typeData = FISHERMAN_TYPES.find(ft => ft.id === typeId);
            const ownedState = loadedState.ownedFishermanTypes[typeId];
            if (typeData && ownedState && ownedState.quantity > 0) {
                const calculatedInterval = calculateFishermanInterval(typeData, ownedState.quantity);
                let nextTimestamp = Date.now() + calculatedInterval;
                const savedTimer = loadedState.fishermanTimers[typeId];

                if (savedTimer) {
                    const timeSinceSave = Date.now() - loadedState.lastSaveTimestamp;
                    const timeRemainingInCycleAtSave = Math.max(0, savedTimer.nextCollectionTimestamp - loadedState.lastSaveTimestamp);
                    
                    if (timeSinceSave < timeRemainingInCycleAtSave) {
                        nextTimestamp = Date.now() + (timeRemainingInCycleAtSave - timeSinceSave);
                    } else {
                        const timeIntoThisCycleAfterOffline = (timeSinceSave - timeRemainingInCycleAtSave) % calculatedInterval;
                        nextTimestamp = Date.now() + (calculatedInterval - timeIntoThisCycleAfterOffline);
                    }
                     if (nextTimestamp <= Date.now() + 100) { // Ensure not too soon
                        nextTimestamp = Date.now() + Math.max(100, calculatedInterval);
                    }
                }
                initialTimers[typeId] = {
                    currentIntervalMs: calculatedInterval,
                    nextCollectionTimestamp: nextTimestamp
                };
            }
        }
      } else { // if no saved timers, initialize them for any loaded fisherman
        FISHERMAN_TYPES.forEach(ft => {
          const currentOwned = loadedOwnedTypes[ft.id];
          if (currentOwned && currentOwned.quantity > 0) {
            const interval = calculateFishermanInterval(ft, currentOwned.quantity);
            initialTimers[ft.id] = {
              currentIntervalMs: interval,
              nextCollectionTimestamp: Date.now() + interval,
            };
          }
        });
      }
      setFishermanTimers(initialTimers);

      const defaultMinigameUpgradeLevels: Record<string, number> = {};
      const defaultMinigameUpgradeCosts: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        defaultMinigameUpgradeLevels[up.id] = 1;
        defaultMinigameUpgradeCosts[up.id] = up.initialCost;
      });
      setMinigameUpgradeLevels(loadedState.minigameUpgradeLevels ?? defaultMinigameUpgradeLevels);
      setNextMinigameUpgradeCosts(loadedState.nextMinigameUpgradeCosts ?? defaultMinigameUpgradeCosts);

    } else { 
      setFish(INITIAL_FISH_COUNT);
      setGlobalRateMultiplier(1);
      setPurchasedUpgrades({});

      const initialFishermanCosts: Record<string, number> = {};
      const initialOwnedFishermanTypes: Record<string, FishermanTypeState> = {};
      FISHERMAN_TYPES.forEach(ft => {
        initialFishermanCosts[ft.id] = ft.initialCost;
        initialOwnedFishermanTypes[ft.id] = { quantity: 0, level: 1, currentCrewUpgradeCost: ft.baseUpgradeCost };
      });
      setNextFishermanCosts(initialFishermanCosts);
      setOwnedFishermanTypes(initialOwnedFishermanTypes);
      setFishermanTimers({}); // No timers initially

      setMinigameMaxFish(INITIAL_MINIGAME_MAX_FISH);
      setMinigameFishLifetime(INITIAL_MINIGAME_FISH_LIFETIME_MS);
      setMinigameFishValue(INITIAL_MINIGAME_FISH_VALUE);

      setCriticalFishChance(INITIAL_CRITICAL_FISH_CHANCE);
      setMinigameMinSpawnMs(INITIAL_MIN_SPAWN_INTERVAL_MS);
      setMinigameMaxSpawnMs(INITIAL_MAX_SPAWN_INTERVAL_MS);

      setBoosterBaitAdditionalChance(0);
      setBoosterBaitAdditionalDurationMs(0);
      setAutoNetCatchAmount(autoNetGlobalUpgrade?.effects?.autoNetInitialCatchAmount ?? DEFAULT_AUTO_NET_CATCH_AMOUNT);

      const initialMinigameUpgradeLevels: Record<string, number> = {};
      const initialMinigameUpgradeCosts: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        initialMinigameUpgradeLevels[up.id] = 1; 
        initialMinigameUpgradeCosts[up.id] = up.initialCost; 
      });
      setMinigameUpgradeLevels(initialMinigameUpgradeLevels);
      setNextMinigameUpgradeCosts(initialMinigameUpgradeCosts);
    }
  }, [autoNetGlobalUpgrade, toast, calculateFishermanInterval]);

  useEffect(() => {
    initializeGameState();
  }, [initializeGameState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
       if (Object.keys(ownedFishermanTypes).length === 0 && fish === INITIAL_FISH_COUNT && Object.keys(nextFishermanCosts).length === 0) {
         // Skip save if potentially not fully initialized early on
         return;
      }

      const gameStateToSave: SavedGameState = {
        fish,
        ownedFishermanTypes,
        purchasedUpgrades,
        globalRateMultiplier,
        nextFishermanCosts,
        minigameMaxFish,
        minigameFishLifetime,
        minigameFishValue,
        minigameUpgradeLevels,
        nextMinigameUpgradeCosts,
        criticalFishChance,
        minigameMinSpawnMs,
        minigameMaxSpawnMs,
        boosterBaitAdditionalChance,
        boosterBaitAdditionalDurationMs,
        autoNetCatchAmount,
        fishermanTimers,
        lastSaveTimestamp: Date.now(),
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameStateToSave));
      } catch (error) {
        console.error("Failed to save game state to localStorage:", error);
      }
    }
  }, [
    fish, ownedFishermanTypes, purchasedUpgrades, globalRateMultiplier, nextFishermanCosts,
    minigameMaxFish, minigameFishLifetime, minigameFishValue, minigameUpgradeLevels, nextMinigameUpgradeCosts,
    criticalFishChance, minigameMinSpawnMs, minigameMaxSpawnMs,
    boosterBaitAdditionalChance, boosterBaitAdditionalDurationMs, autoNetCatchAmount,
    fishermanTimers
  ]);
  
  // Game loop for crew collections
  useEffect(() => {
    const gameLoopIntervalId = setInterval(() => {
      const now = Date.now();
      let fishCollectedThisTick = 0;
      const newTimersState = { ...fishermanTimers };
      let timersUpdated = false;

      for (const typeId in ownedFishermanTypes) {
        const typeState = ownedFishermanTypes[typeId];
        if (typeState.quantity > 0) {
          const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
          const timerState = fishermanTimers[typeId];

          if (fishermanType && timerState && now >= timerState.nextCollectionTimestamp) {
            const amountCollected = fishermanType.baseCollectionAmount * typeState.level * effectiveGlobalRateMultiplier;
            fishCollectedThisTick += amountCollected;
            
            newTimersState[typeId] = {
              ...timerState,
              nextCollectionTimestamp: now + timerState.currentIntervalMs,
            };
            timersUpdated = true;
          }
        }
      }

      if (fishCollectedThisTick > 0) {
        setFish(prevFish => prevFish + fishCollectedThisTick);
      }
      if (timersUpdated) {
        setFishermanTimers(newTimersState);
      }
    }, GAME_TICK_INTERVAL_MS);

    return () => clearInterval(gameLoopIntervalId);
  }, [ownedFishermanTypes, fishermanTimers, effectiveGlobalRateMultiplier, setFish]);


  const averageTotalFishPerSecond = useMemo(() => {
    let totalAverage = 0;
    for (const typeId in ownedFishermanTypes) {
        const typeState = ownedFishermanTypes[typeId];
        const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
        const timerState = fishermanTimers[typeId];
        if (typeState.quantity > 0 && fishermanType && timerState && timerState.currentIntervalMs > 0 && timerState.currentIntervalMs !== Infinity) {
            const amountPerCollection = fishermanType.baseCollectionAmount * typeState.level * effectiveGlobalRateMultiplier;
            totalAverage += amountPerCollection / (timerState.currentIntervalMs / 1000);
        }
    }
    return totalAverage;
  }, [ownedFishermanTypes, fishermanTimers, effectiveGlobalRateMultiplier]);
  
  useEffect(() => {
    let marketAnalysisIntervalId: NodeJS.Timeout | undefined;
    let marketAnalysisTimerId: NodeJS.Timeout | undefined;

    if (purchasedUpgrades['market_analysis'] && marketAnalysisGlobalUpgrade?.effects) {
      const { marketAnalysisChance = DEFAULT_MARKET_ANALYSIS_CHANCE, marketAnalysisDurationMs = DEFAULT_MARKET_ANALYSIS_DURATION_MS } = marketAnalysisGlobalUpgrade.effects;
      
      marketAnalysisIntervalId = setInterval(() => {
        if (!isMarketAnalysisActive && Math.random() < marketAnalysisChance) {
          setIsMarketAnalysisActive(true);
          setMarketAnalysisEndTime(Date.now() + marketAnalysisDurationMs);
          toast({ title: "Market Surge!", description: "All fish income doubled for a short time!", variant: "default" });
        }
      }, 1000); 
    }

    if (isMarketAnalysisActive && marketAnalysisEndTime) {
      const remainingTime = marketAnalysisEndTime - Date.now();
      if (remainingTime > 0) {
        marketAnalysisTimerId = setTimeout(() => {
          setIsMarketAnalysisActive(false);
          setMarketAnalysisEndTime(null);
          toast({ title: "Market Normalizes", description: "Fish income back to normal.", variant: "default" });
        }, remainingTime);
      } else {
        setIsMarketAnalysisActive(false);
        setMarketAnalysisEndTime(null);
      }
    }
    return () => {
      clearInterval(marketAnalysisIntervalId);
      clearTimeout(marketAnalysisTimerId);
    };
  }, [purchasedUpgrades, isMarketAnalysisActive, marketAnalysisEndTime, marketAnalysisGlobalUpgrade, toast]);


  const handleHireFisherman = (typeId: string) => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    if (!fishermanType) return;
    const cost = nextFishermanCosts[typeId] || fishermanType.initialCost;

    if (fish >= cost) {
      setFish(prevFish => prevFish - cost);
      const newQuantity = (ownedFishermanTypes[typeId]?.quantity || 0) + 1;
      setOwnedFishermanTypes(prevTypes => {
        const currentTypeState = prevTypes[typeId] || { quantity: 0, level: 1, currentCrewUpgradeCost: fishermanType.baseUpgradeCost };
        return { ...prevTypes, [typeId]: { ...currentTypeState, quantity: newQuantity } };
      });
      setNextFishermanCosts(prevCosts => ({ ...prevCosts, [typeId]: Math.ceil(cost * fishermanType.costIncreaseFactor) }));
      
      const newInterval = calculateFishermanInterval(fishermanType, newQuantity);
      setFishermanTimers(prevTimers => ({
        ...prevTimers,
        [typeId]: {
          currentIntervalMs: newInterval,
          nextCollectionTimestamp: prevTimers[typeId] ? 
            (prevTimers[typeId].nextCollectionTimestamp - prevTimers[typeId].currentIntervalMs + newInterval) : 
            (Date.now() + newInterval),
        }
      }));

      toast({ title: "Fisherman Hired!", description: `You hired a ${fishermanType.name}.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(cost).toLocaleString('en-US')} fish.`, variant: "destructive" });
    }
  };

  const handleUpgradeFishermanType = (typeId: string) => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    const currentTypeState = ownedFishermanTypes[typeId];
    if (!fishermanType || !currentTypeState || currentTypeState.quantity === 0) return;
    const crewUpgradeCost = currentTypeState.currentCrewUpgradeCost;
    if (fish >= crewUpgradeCost) {
      setFish(prevFish => prevFish - crewUpgradeCost);
      setOwnedFishermanTypes(prevTypes => ({ ...prevTypes, [typeId]: { ...currentTypeState, level: currentTypeState.level + 1, currentCrewUpgradeCost: Math.ceil(currentTypeState.currentCrewUpgradeCost * fishermanType.upgradeCostIncreaseFactor) } }));
      toast({ title: `${fishermanType.name} Crew Upgraded!`, description: `Level ${currentTypeState.level + 1}.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(crewUpgradeCost).toLocaleString('en-US')} fish.`, variant: "destructive" });
    }
  };

  const handlePurchaseGlobalUpgrade = (upgradeId: string) => {
    const upgradeData = GLOBAL_UPGRADES_DATA.find(up => up.id === upgradeId);
    if (!upgradeData || purchasedUpgrades[upgradeId]) return;
    if (fish >= upgradeData.cost) {
      setFish(prevFish => prevFish - upgradeData.cost);
      setPurchasedUpgrades(prev => ({ ...prev, [upgradeId]: true }));
      if (upgradeData.rateMultiplierIncrease) {
        setGlobalRateMultiplier(prev => prev * (1 + upgradeData.rateMultiplierIncrease!));
      }
      if (upgradeId === 'automated_trawling_net' && upgradeData.effects?.autoNetInitialCatchAmount) {
         setAutoNetCatchAmount(upgradeData.effects.autoNetInitialCatchAmount);
      }

      toast({ title: "Upgrade Purchased!", description: `${upgradeData.name} active.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `Need ${upgradeData.cost.toLocaleString('en-US')} fish.`, variant: "destructive" });
    }
  };

 const handlePurchaseMinigameUpgrade = (upgradeId: string) => {
    const upgradeData = MINIGAME_UPGRADES_DATA.find(up => up.id === upgradeId);
    if (!upgradeData) return;
    const currentLevel = minigameUpgradeLevels[upgradeId] || 1;
    if (upgradeData.maxLevel && currentLevel >= upgradeData.maxLevel) {
      toast({ title: "Max Level Reached", variant: "default" }); return;
    }
    const cost = nextMinigameUpgradeCosts[upgradeId] || upgradeData.initialCost;
    if (fish >= cost) {
      setFish(prevFish => prevFish - cost);
      const newLevel = currentLevel + 1;
      setMinigameUpgradeLevels(prevLevels => ({ ...prevLevels, [upgradeId]: newLevel }));
      setNextMinigameUpgradeCosts(prevCosts => ({ ...prevCosts, [upgradeId]: Math.ceil(cost * upgradeData.costIncreaseFactor) }));

      switch (upgradeData.effect.type) {
        case 'maxFish': setMinigameMaxFish(prev => prev + upgradeData.effect.value); break;
        case 'lifetime': setMinigameFishLifetime(prev => prev + upgradeData.effect.value); break;
        case 'value': setMinigameFishValue(prev => prev + upgradeData.effect.value); break;
        case 'criticalChance': setCriticalFishChance(prev => prev + upgradeData.effect.value); break;
        case 'spawnCooldownReduction':
          setMinigameMinSpawnMs(prev => Math.max(MIN_POSSIBLE_SPAWN_INTERVAL_MS, prev - upgradeData.effect.value));
          setMinigameMaxSpawnMs(prev => Math.max(MIN_POSSIBLE_SPAWN_INTERVAL_MS + 100, prev - upgradeData.effect.value)); 
          break;
        case 'boosterBaitChance': setBoosterBaitAdditionalChance(prev => prev + upgradeData.effect.value); break;
        case 'boosterBaitDuration': setBoosterBaitAdditionalDurationMs(prev => prev + upgradeData.effect.value); break;
        case 'autoNetCatchAmount': setAutoNetCatchAmount(prev => prev + upgradeData.effect.value); break;
      }
      toast({ title: "Minigame Upgrade!", description: `${upgradeData.name} Lvl ${newLevel}.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `Need ${cost.toLocaleString('en-US')} fish.`, variant: "destructive" });
    }
  };
  
  const effectiveBoosterBaitChance = useMemo(() => {
    if (!purchasedUpgrades['booster_bait'] || !boosterBaitGlobalUpgrade?.effects?.boosterInitialChance) return 0;
    return boosterBaitGlobalUpgrade.effects.boosterInitialChance + boosterBaitAdditionalChance;
  }, [purchasedUpgrades, boosterBaitGlobalUpgrade, boosterBaitAdditionalChance]);

  const effectiveBoosterBaitDurationMs = useMemo(() => {
    if (!purchasedUpgrades['booster_bait'] || !boosterBaitGlobalUpgrade?.effects?.boosterInitialDurationMs) return 0;
    return boosterBaitGlobalUpgrade.effects.boosterInitialDurationMs + boosterBaitAdditionalDurationMs;
  }, [purchasedUpgrades, boosterBaitGlobalUpgrade, boosterBaitAdditionalDurationMs]);
  
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (isBoosterActive && boosterEndTime) {
      const remainingTime = boosterEndTime - Date.now();
      if (remainingTime > 0) {
        timerId = setTimeout(() => {
          setIsBoosterActive(false);
          setBoosterEndTime(null);
          toast({ title: "Booster Expired", description: "Frenzy over.", variant: "default" });
        }, remainingTime);
      } else {
        setIsBoosterActive(false);
        setBoosterEndTime(null);
      }
    }
    return () => clearTimeout(timerId);
  }, [isBoosterActive, boosterEndTime, toast]);

  useEffect(() => {
    if (autoNetTimerRef.current) clearInterval(autoNetTimerRef.current);
    if (purchasedUpgrades['automated_trawling_net'] && autoNetGlobalUpgrade?.effects) {
      const interval = autoNetGlobalUpgrade.effects.autoNetIntervalMs || DEFAULT_AUTO_NET_INTERVAL_MS;
      autoNetTimerRef.current = setInterval(() => {
        const fishToCatch = autoNetCatchAmount;
        const valuePerCatch = minigameFishValue; 
        setFish(prev => prev + (fishToCatch * valuePerCatch));
        if (fishToCatch > 0) {
             toast({ title: "Net Haul!", description: `Automated net caught ${fishToCatch * valuePerCatch} fish.`, variant: "default" });
        }
      }, interval);
    }
    return () => {
      if (autoNetTimerRef.current) clearInterval(autoNetTimerRef.current);
    };
  }, [purchasedUpgrades, autoNetGlobalUpgrade, autoNetCatchAmount, minigameFishValue, toast]);


  const handleMinigameFishCaught = useCallback((caughtValue: number) => {
    const finalCaughtValue = caughtValue * (isMarketAnalysisActive ? (marketAnalysisGlobalUpgrade?.effects?.marketAnalysisMultiplier ?? 1) : 1);
    setFish(prevFish => prevFish + finalCaughtValue);

    if (purchasedUpgrades['booster_bait'] && boosterBaitGlobalUpgrade?.effects && !isBoosterActive && Math.random() < effectiveBoosterBaitChance) {
      setIsBoosterActive(true);
      setBoosterEndTime(Date.now() + effectiveBoosterBaitDurationMs);
      toast({ title: "Booster Bait Activated!", description: "Fishing frenzy!", variant: "default" });
    }
  }, [isMarketAnalysisActive, marketAnalysisGlobalUpgrade, purchasedUpgrades, boosterBaitGlobalUpgrade, isBoosterActive, effectiveBoosterBaitChance, effectiveBoosterBaitDurationMs, toast]);

  const resetGame = () => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(LOCAL_STORAGE_KEY); } 
      catch (error) { console.error("Failed to clear game state:", error); }
    }
    initializeGameState(true); 
    toast({ title: "Game Reset", description: "Starting fresh!", variant: "default"});
  };

  const currentMinigameParams = useMemo(() => {
    if (isBoosterActive && boosterBaitGlobalUpgrade?.effects) {
      return {
        maxFish: minigameMaxFish * (boosterBaitGlobalUpgrade.effects.boosterMaxFishMultiplier || 1),
        minSpawnMs: boosterBaitGlobalUpgrade.effects.boosterSpawnIntervalMs || DEFAULT_BOOSTER_SPAWN_INTERVAL_MS,
        maxSpawnMs: (boosterBaitGlobalUpgrade.effects.boosterSpawnIntervalMs || DEFAULT_BOOSTER_SPAWN_INTERVAL_MS) + 100, 
        lifetime: minigameFishLifetime, 
        value: minigameFishValue, 
        critChance: criticalFishChance,
      };
    }
    return {
      maxFish: minigameMaxFish,
      minSpawnMs: minigameMinSpawnMs,
      maxSpawnMs: minigameMaxSpawnMs,
      lifetime: minigameFishLifetime,
      value: minigameFishValue,
      critChance: criticalFishChance,
    };
  }, [isBoosterActive, boosterBaitGlobalUpgrade, minigameMaxFish, minigameMinSpawnMs, minigameMaxSpawnMs, minigameFishLifetime, minigameFishValue, criticalFishChance]);

  const filteredMinigameUpgrades = useMemo(() => {
    return MINIGAME_UPGRADES_DATA.filter(up => 
      !up.requiredGlobalUpgradeId || purchasedUpgrades[up.requiredGlobalUpgradeId]
    );
  }, [purchasedUpgrades]);


  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 space-y-6 bg-background text-foreground">
      
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        <div className="flex flex-col space-y-4 items-center md:items-start md:col-span-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center md:text-left" style={{ color: 'hsl(var(--primary-foreground))', WebkitTextStroke: '1px hsl(var(--primary))', textShadow:'2px 2px 4px hsla(var(--primary), 0.5)'}}>
            Fish World Tycoon
          </h1>
          <FishDisplay fishCount={fish} averageFishPerSecond={averageTotalFishPerSecond} />
          <div className="w-full flex justify-center md:justify-start mt-2">
            <GameStatisticsModal
                totalFish={fish}
                averageTotalFishPerSecond={averageTotalFishPerSecond}
                ownedFishermanTypes={ownedFishermanTypes}
                fishermanTypesData={FISHERMAN_TYPES}
                fishermanTimers={fishermanTimers}
                globalRateMultiplier={globalRateMultiplier}
                effectiveGlobalRateMultiplier={effectiveGlobalRateMultiplier}
                currentMinigameParams={currentMinigameParams}
                baseMinigameStats={{
                  maxFish: minigameMaxFish,
                  lifetime: minigameFishLifetime,
                  value: minigameFishValue,
                  critChance: criticalFishChance,
                  minSpawnMs: minigameMinSpawnMs,
                  maxSpawnMs: minigameMaxSpawnMs,
                }}
                isBoosterActive={isBoosterActive}
                boosterEndTime={boosterEndTime}
                purchasedUpgrades={purchasedUpgrades}
                boosterBaitGlobalUpgrade={boosterBaitGlobalUpgrade}
                effectiveBoosterBaitChance={effectiveBoosterBaitChance}
                effectiveBoosterBaitDurationMs={effectiveBoosterBaitDurationMs}
                autoNetGlobalUpgrade={autoNetGlobalUpgrade}
                autoNetCatchAmount={autoNetCatchAmount}
                autoNetBaseInterval={autoNetGlobalUpgrade?.effects?.autoNetIntervalMs ?? DEFAULT_AUTO_NET_INTERVAL_MS}
                isMarketAnalysisActive={isMarketAnalysisActive}
                marketAnalysisEndTime={marketAnalysisEndTime}
                marketAnalysisGlobalUpgrade={marketAnalysisGlobalUpgrade}
                gameConfigData={{
                    INITIAL_MINIGAME_MAX_FISH,
                    INITIAL_MINIGAME_FISH_LIFETIME_MS,
                    INITIAL_MINIGAME_FISH_VALUE,
                    INITIAL_CRITICAL_FISH_CHANCE,
                    INITIAL_MIN_SPAWN_INTERVAL_MS,
                    INITIAL_MAX_SPAWN_INTERVAL_MS,
                    DEFAULT_BOOSTER_BAIT_CHANCE,
                    DEFAULT_BOOSTER_BAIT_DURATION_MS,
                    DEFAULT_BOOSTER_SPAWN_INTERVAL_MS,
                    DEFAULT_BOOSTER_MAX_FISH_MULTIPLIER,
                    DEFAULT_AUTO_NET_CATCH_AMOUNT,
                    DEFAULT_AUTO_NET_INTERVAL_MS,
                    DEFAULT_MARKET_ANALYSIS_CHANCE,
                    DEFAULT_MARKET_ANALYSIS_DURATION_MS,
                    DEFAULT_MARKET_ANALYSIS_MULTIPLIER
                }}
                onResetGame={resetGame}
              />
          </div>
          {isBoosterActive && <p className="text-center md:text-left text-lg font-semibold text-primary animate-pulse">BOOSTER ACTIVE!</p>}
          {isMarketAnalysisActive && <p className="text-center md:text-left text-lg font-semibold text-accent animate-pulse">MARKET SURGE! (x2 Fish Income)</p>}
        </div>

        <div className="flex justify-center w-full md:col-span-3">
          <ClickableFishGame 
            onFishCaught={handleMinigameFishCaught}
            maxFishOnScreen={currentMinigameParams.maxFish}
            fishLifetimeMs={currentMinigameParams.lifetime}
            fishValueOnClick={currentMinigameParams.value}
            criticalFishChance={currentMinigameParams.critChance}
            minSpawnIntervalMs={currentMinigameParams.minSpawnMs}
            maxSpawnIntervalMs={currentMinigameParams.maxSpawnMs}
          />
        </div>
      </div>

      <main className="w-full max-w-6xl space-y-8">
        <Accordion type="multiple" className="w-full space-y-0" defaultValue={["hire-crew", "research-upgrades", "minigame-upgrades"]}>
          <AccordionItem value="hire-crew" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4">
              <h2 className="text-2xl font-semibold text-center sm:text-left flex-1">Hire &amp; Manage Crew</h2>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {FISHERMAN_TYPES.map(type => {
                  const typeState = ownedFishermanTypes[type.id] || { quantity: 0, level: 1, currentCrewUpgradeCost: type.baseUpgradeCost };
                  const timerState = fishermanTimers[type.id];
                  const canAffordHire = fish >= (nextFishermanCosts[type.id] || type.initialCost);
                  const canAffordCrewUpgrade = fish >= typeState.currentCrewUpgradeCost && typeState.quantity > 0;
                  const collectionIntervalSeconds = timerState && timerState.currentIntervalMs !== Infinity ? (timerState.currentIntervalMs / 1000) : (type.baseCollectionTimeMs / 1000);
                  const collectionAmount = type.baseCollectionAmount * typeState.level * effectiveGlobalRateMultiplier;

                  return (
                    <HireableFishermanCard
                      key={type.id}
                      fishermanType={type}
                      onHire={handleHireFisherman}
                      currentHireCost={nextFishermanCosts[type.id] || type.initialCost}
                      canAffordHire={canAffordHire}
                      ownedQuantity={typeState.quantity}
                      currentLevel={typeState.level}
                      currentCrewUpgradeCost={typeState.currentCrewUpgradeCost}
                      onUpgrade={handleUpgradeFishermanType}
                      canAffordCrewUpgrade={canAffordCrewUpgrade}
                      collectionAmount={collectionAmount}
                      collectionIntervalSeconds={collectionIntervalSeconds}
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="research-upgrades" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4">
              <h2 className="text-2xl font-semibold text-center sm:text-left flex-1">Research Upgrades</h2>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {GLOBAL_UPGRADES_DATA.map(upgrade => (
                  <PurchasableUpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    onPurchase={handlePurchaseGlobalUpgrade}
                    isPurchased={!!purchasedUpgrades[upgrade.id]}
                    canAfford={fish >= upgrade.cost}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        
          <AccordionItem value="minigame-upgrades" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4">
              <h2 className="text-2xl font-semibold text-center sm:text-left flex-1">Catching Fish Upgrades</h2>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {filteredMinigameUpgrades.map(upgrade => {
                  const currentLevel = minigameUpgradeLevels[upgrade.id] || 1;
                  const nextCost = nextMinigameUpgradeCosts[upgrade.id] || upgrade.initialCost;
                  const canAfford = fish >= nextCost;
                  const isMaxLevel = upgrade.maxLevel ? currentLevel >= upgrade.maxLevel : false;

                  return (
                    <MinigameUpgradeCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      onPurchase={handlePurchaseMinigameUpgrade}
                      currentLevel={currentLevel}
                      nextCost={nextCost}
                      canAfford={canAfford && !isMaxLevel}
                      isMaxLevel={isMaxLevel}
                      gameStats={{
                        minigameMaxFish,
                        minigameFishLifetime,
                        minigameFishValue,
                        criticalFishChance,
                        minigameMinSpawnMs,
                        minigameMaxSpawnMs,
                        boosterBaitBaseChance: boosterBaitGlobalUpgrade?.effects?.boosterInitialChance ?? DEFAULT_BOOSTER_BAIT_CHANCE,
                        boosterBaitAdditionalChance,
                        boosterBaitBaseDurationMs: boosterBaitGlobalUpgrade?.effects?.boosterInitialDurationMs ?? DEFAULT_BOOSTER_BAIT_DURATION_MS,
                        boosterBaitAdditionalDurationMs,
                        autoNetBaseCatchAmount: autoNetGlobalUpgrade?.effects?.autoNetInitialCatchAmount ?? DEFAULT_AUTO_NET_CATCH_AMOUNT,
                        autoNetCatchAmount
                      }}
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <Separator className="my-6" /> 
        
      </main>
    </div>
  );
}
