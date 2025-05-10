
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
  DEFAULT_MARKET_ANALYSIS_MULTIPLIER
} from '@/config/gameData';
import { RotateCcw } from 'lucide-react';
import { ClickableFishGame } from '@/components/game/ClickableFishGame';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LOCAL_STORAGE_KEY = 'fishWorldTycoonSaveData_v2'; // Incremented version for new state

interface FishermanTypeState {
  quantity: number;
  level: number;
  currentCrewUpgradeCost: number; 
}

interface SavedGameState {
  fish: number;
  ownedFishermanTypes: Record<string, FishermanTypeState>;
  purchasedUpgrades: Record<string, boolean>;
  globalRateMultiplier: number;
  nextFishermanCosts: Record<string, number>;
  
  // Minigame Core Stats
  minigameMaxFish: number;
  minigameFishLifetime: number;
  minigameFishValue: number;
  minigameUpgradeLevels: Record<string, number>;
  nextMinigameUpgradeCosts: Record<string, number>;

  // New Minigame Stats
  criticalFishChance: number;
  minigameMinSpawnMs: number;
  minigameMaxSpawnMs: number;

  // Booster Bait Stats
  boosterBaitAdditionalChance: number;
  boosterBaitAdditionalDurationMs: number;

  // Automated Netting Stats
  autoNetCatchAmount: number;
}

export default function FishWorldTycoonPage() {
  const [fish, setFish] = useState<number>(INITIAL_FISH_COUNT);
  const [ownedFishermanTypes, setOwnedFishermanTypes] = useState<Record<string, FishermanTypeState>>({});
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, boolean>>({});
  const [globalRateMultiplier, setGlobalRateMultiplier] = useState<number>(1);
  const [nextFishermanCosts, setNextFishermanCosts] = useState<Record<string, number>>({});

  // Minigame Core Stats
  const [minigameMaxFish, setMinigameMaxFish] = useState<number>(INITIAL_MINIGAME_MAX_FISH);
  const [minigameFishLifetime, setMinigameFishLifetime] = useState<number>(INITIAL_MINIGAME_FISH_LIFETIME_MS);
  const [minigameFishValue, setMinigameFishValue] = useState<number>(INITIAL_MINIGAME_FISH_VALUE);
  const [minigameUpgradeLevels, setMinigameUpgradeLevels] = useState<Record<string, number>>({});
  const [nextMinigameUpgradeCosts, setNextMinigameUpgradeCosts] = useState<Record<string, number>>({});

  // New Minigame Stats
  const [criticalFishChance, setCriticalFishChance] = useState<number>(INITIAL_CRITICAL_FISH_CHANCE);
  const [minigameMinSpawnMs, setMinigameMinSpawnMs] = useState<number>(INITIAL_MIN_SPAWN_INTERVAL_MS);
  const [minigameMaxSpawnMs, setMinigameMaxSpawnMs] = useState<number>(INITIAL_MAX_SPAWN_INTERVAL_MS);

  // Booster Bait
  const [boosterBaitAdditionalChance, setBoosterBaitAdditionalChance] = useState<number>(0);
  const [boosterBaitAdditionalDurationMs, setBoosterBaitAdditionalDurationMs] = useState<number>(0);
  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(false);
  const [boosterEndTime, setBoosterEndTime] = useState<number | null>(null);
  const boosterBaitGlobalUpgrade = useMemo(() => GLOBAL_UPGRADES_DATA.find(up => up.id === 'booster_bait'), []);

  // Automated Trawling Net
  const [autoNetCatchAmount, setAutoNetCatchAmount] = useState<number>(DEFAULT_AUTO_NET_CATCH_AMOUNT);
  const autoNetGlobalUpgrade = useMemo(() => GLOBAL_UPGRADES_DATA.find(up => up.id === 'automated_trawling_net'), []);
  const autoNetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Market Analysis
  const [isMarketAnalysisActive, setIsMarketAnalysisActive] = useState<boolean>(false);
  const [marketAnalysisEndTime, setMarketAnalysisEndTime] = useState<number | null>(null);
  const marketAnalysisGlobalUpgrade = useMemo(() => GLOBAL_UPGRADES_DATA.find(up => up.id === 'market_analysis'), []);

  const { toast } = useToast();

  const effectiveGlobalRateMultiplier = useMemo(() => {
    return globalRateMultiplier * (isMarketAnalysisActive ? (marketAnalysisGlobalUpgrade?.effects?.marketAnalysisMultiplier ?? 1) : 1);
  }, [globalRateMultiplier, isMarketAnalysisActive, marketAnalysisGlobalUpgrade]);

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

    if (loadedState) {
      setFish(loadedState.fish ?? INITIAL_FISH_COUNT);
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
      setOwnedFishermanTypes(loadedState.ownedFishermanTypes ?? defaultOwnedFishermanTypes);
      
      const defaultMinigameUpgradeLevels: Record<string, number> = {};
      const defaultMinigameUpgradeCosts: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        defaultMinigameUpgradeLevels[up.id] = 1;
        defaultMinigameUpgradeCosts[up.id] = up.initialCost;
      });
      setMinigameUpgradeLevels(loadedState.minigameUpgradeLevels ?? defaultMinigameUpgradeLevels);
      setNextMinigameUpgradeCosts(loadedState.nextMinigameUpgradeCosts ?? defaultMinigameUpgradeCosts);

    } else { // Initialize with defaults
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
  }, [autoNetGlobalUpgrade]);

  useEffect(() => {
    initializeGameState();
  }, [initializeGameState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (Object.keys(ownedFishermanTypes).length === 0 && fish === INITIAL_FISH_COUNT && Object.keys(nextFishermanCosts).length === 0) {
         // Skip save if potentially not fully initialized
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
    boosterBaitAdditionalChance, boosterBaitAdditionalDurationMs, autoNetCatchAmount
  ]);

  const totalFishPerSecond = useMemo(() => {
    let total = 0;
    for (const typeId in ownedFishermanTypes) {
      const typeState = ownedFishermanTypes[typeId];
      if (typeState.quantity > 0) {
        const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
        if (fishermanType) {
          const ratePerUnit = fishermanType.baseRate * typeState.level * effectiveGlobalRateMultiplier;
          total += ratePerUnit * typeState.quantity;
        }
      }
    }
    return total;
  }, [ownedFishermanTypes, effectiveGlobalRateMultiplier]);
  
  // Market Analysis Activation & Timer
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
      }, 1000); // Check every second
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


  useEffect(() => {
    const intervalId = setInterval(() => {
      setFish(prevFish => prevFish + totalFishPerSecond); // totalFishPerSecond already considers market analysis
    }, GAME_TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [totalFishPerSecond]);

  const handleHireFisherman = (typeId: string) => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    if (!fishermanType) return;
    const cost = nextFishermanCosts[typeId] || fishermanType.initialCost;
    if (fish >= cost) {
      setFish(prevFish => prevFish - cost);
      setOwnedFishermanTypes(prevTypes => {
        const currentTypeState = prevTypes[typeId] || { quantity: 0, level: 1, currentCrewUpgradeCost: fishermanType.baseUpgradeCost };
        return { ...prevTypes, [typeId]: { ...currentTypeState, quantity: currentTypeState.quantity + 1 } };
      });
      setNextFishermanCosts(prevCosts => ({ ...prevCosts, [typeId]: Math.ceil(cost * fishermanType.costIncreaseFactor) }));
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
      // Specific logic for new global upgrades
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
          setMinigameMaxSpawnMs(prev => Math.max(MIN_POSSIBLE_SPAWN_INTERVAL_MS + 100, prev - upgradeData.effect.value)); // Ensure max > min
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
  
  // Booster Bait Activation & Timer
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

  // Automated Trawling Net Logic
  useEffect(() => {
    if (autoNetTimerRef.current) clearInterval(autoNetTimerRef.current);
    if (purchasedUpgrades['automated_trawling_net'] && autoNetGlobalUpgrade?.effects) {
      const interval = autoNetGlobalUpgrade.effects.autoNetIntervalMs || DEFAULT_AUTO_NET_INTERVAL_MS;
      autoNetTimerRef.current = setInterval(() => {
        const fishToCatch = autoNetCatchAmount;
        const valuePerCatch = minigameFishValue; // Use current minigame fish value
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

  // Determine current minigame parameters based on booster state
  const currentMinigameParams = useMemo(() => {
    if (isBoosterActive && boosterBaitGlobalUpgrade?.effects) {
      return {
        maxFish: minigameMaxFish * (boosterBaitGlobalUpgrade.effects.boosterMaxFishMultiplier || 1),
        minSpawnMs: boosterBaitGlobalUpgrade.effects.boosterSpawnIntervalMs || DEFAULT_BOOSTER_SPAWN_INTERVAL_MS,
        maxSpawnMs: (boosterBaitGlobalUpgrade.effects.boosterSpawnIntervalMs || DEFAULT_BOOSTER_SPAWN_INTERVAL_MS) + 100, // Make max slightly higher
        lifetime: minigameFishLifetime, // Booster doesn't change lifetime by default
        value: minigameFishValue, // Booster doesn't change value by default
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
          <FishDisplay fishCount={fish} fishPerSecond={totalFishPerSecond} />
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
                  const canAffordHire = fish >= (nextFishermanCosts[type.id] || type.initialCost);
                  const canAffordCrewUpgrade = fish >= typeState.currentCrewUpgradeCost && typeState.quantity > 0;
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
                      globalRateMultiplier={effectiveGlobalRateMultiplier} // Use effective multiplier here
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
                      // Pass current game state for accurate display
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
        
        <footer className="w-full flex justify-center py-6">
            <Button onClick={resetGame} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
            </Button>
        </footer>
      </main>
    </div>
  );
}
