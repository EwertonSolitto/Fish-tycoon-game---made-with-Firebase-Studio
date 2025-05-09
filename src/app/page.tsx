
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FishermanType } from '@/config/gameData';
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
  INITIAL_MINIGAME_FISH_VALUE
} from '@/config/gameData';
import { RotateCcw } from 'lucide-react';
import { ClickableFishGame } from '@/components/game/ClickableFishGame';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LOCAL_STORAGE_KEY = 'fishWorldTycoonSaveData_v1';

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
  minigameMaxFish: number;
  minigameFishLifetime: number;
  minigameFishValue: number;
  minigameUpgradeLevels: Record<string, number>;
  nextMinigameUpgradeCosts: Record<string, number>;
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

  const { toast } = useToast();

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

      const defaultFishermanCosts: Record<string, number> = {};
      const defaultOwnedFishermanTypes: Record<string, FishermanTypeState> = {};
      FISHERMAN_TYPES.forEach(ft => {
        defaultFishermanCosts[ft.id] = ft.initialCost;
        defaultOwnedFishermanTypes[ft.id] = {
          quantity: 0,
          level: 1,
          currentCrewUpgradeCost: ft.baseUpgradeCost,
        };
      });

      const finalNextFishermanCosts: Record<string, number> = {};
      FISHERMAN_TYPES.forEach(ft => {
        finalNextFishermanCosts[ft.id] = loadedState!.nextFishermanCosts?.[ft.id] ?? defaultFishermanCosts[ft.id];
      });
      setNextFishermanCosts(finalNextFishermanCosts);

      const finalOwnedFishermanTypes: Record<string, FishermanTypeState> = {};
      FISHERMAN_TYPES.forEach(ft => {
        finalOwnedFishermanTypes[ft.id] = {
          ...defaultOwnedFishermanTypes[ft.id],
          ...(loadedState!.ownedFishermanTypes?.[ft.id] ?? {}),
        };
      });
      setOwnedFishermanTypes(finalOwnedFishermanTypes);
      
      const defaultMinigameUpgradeLevels: Record<string, number> = {};
      const defaultMinigameUpgradeCosts: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        defaultMinigameUpgradeLevels[up.id] = 1;
        defaultMinigameUpgradeCosts[up.id] = up.initialCost;
      });

      const finalMinigameUpgradeLevels: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        finalMinigameUpgradeLevels[up.id] = loadedState!.minigameUpgradeLevels?.[up.id] ?? defaultMinigameUpgradeLevels[up.id];
      });
      setMinigameUpgradeLevels(finalMinigameUpgradeLevels);

      const finalMinigameUpgradeCosts: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        finalMinigameUpgradeCosts[up.id] = loadedState!.nextMinigameUpgradeCosts?.[up.id] ?? defaultMinigameUpgradeCosts[up.id];
      });
      setNextMinigameUpgradeCosts(finalMinigameUpgradeCosts);

    } else {
      setFish(INITIAL_FISH_COUNT);
      setGlobalRateMultiplier(1);
      setPurchasedUpgrades({});

      const initialFishermanCosts: Record<string, number> = {};
      const initialOwnedFishermanTypes: Record<string, FishermanTypeState> = {};
      FISHERMAN_TYPES.forEach(ft => {
        initialFishermanCosts[ft.id] = ft.initialCost;
        initialOwnedFishermanTypes[ft.id] = {
          quantity: 0,
          level: 1,
          currentCrewUpgradeCost: ft.baseUpgradeCost,
        };
      });
      setNextFishermanCosts(initialFishermanCosts);
      setOwnedFishermanTypes(initialOwnedFishermanTypes);

      setMinigameMaxFish(INITIAL_MINIGAME_MAX_FISH);
      setMinigameFishLifetime(INITIAL_MINIGAME_FISH_LIFETIME_MS);
      setMinigameFishValue(INITIAL_MINIGAME_FISH_VALUE);

      const initialMinigameUpgradeLevels: Record<string, number> = {};
      const initialMinigameUpgradeCosts: Record<string, number> = {};
      MINIGAME_UPGRADES_DATA.forEach(up => {
        initialMinigameUpgradeLevels[up.id] = 1; 
        initialMinigameUpgradeCosts[up.id] = up.initialCost; 
      });
      setMinigameUpgradeLevels(initialMinigameUpgradeLevels);
      setNextMinigameUpgradeCosts(initialMinigameUpgradeCosts);
    }
  }, []);

  useEffect(() => {
    initializeGameState();
  }, [initializeGameState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Don't save if state might not be fully initialized yet, e.g. on first hydration
      // Check if essential parts of state are populated.
      if (Object.keys(ownedFishermanTypes).length === 0 && fish === INITIAL_FISH_COUNT && Object.keys(nextFishermanCosts).length === 0) {
         // Potentially initial state before hydration or proper initialization, skip save.
         // This check can be refined based on how initial state is structured.
         // A more robust way is to ensure initializeGameState has fully run.
         // For now, this basic check might prevent saving an "empty" state too early.
         // However, if initializeGameState correctly sets to defaults, saving defaults is fine.
         // The main concern is saving BEFORE initializeGameState loads from localStorage.
         // The current structure (initializeGameState in mount effect) should handle this.
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
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameStateToSave));
      } catch (error) {
        console.error("Failed to save game state to localStorage:", error);
      }
    }
  }, [
    fish, 
    ownedFishermanTypes, 
    purchasedUpgrades, 
    globalRateMultiplier, 
    nextFishermanCosts,
    minigameMaxFish,
    minigameFishLifetime,
    minigameFishValue,
    minigameUpgradeLevels,
    nextMinigameUpgradeCosts
  ]);

  const totalFishPerSecond = useMemo(() => {
    let total = 0;
    for (const typeId in ownedFishermanTypes) {
      const typeState = ownedFishermanTypes[typeId];
      if (typeState.quantity > 0) {
        const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
        if (fishermanType) {
          const ratePerUnit = fishermanType.baseRate * typeState.level * globalRateMultiplier;
          total += ratePerUnit * typeState.quantity;
        }
      }
    }
    return total;
  }, [ownedFishermanTypes, globalRateMultiplier]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFish(prevFish => prevFish + totalFishPerSecond);
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
        return {
          ...prevTypes,
          [typeId]: {
            ...currentTypeState,
            quantity: currentTypeState.quantity + 1,
          },
        };
      });
      
      setNextFishermanCosts(prevCosts => ({
        ...prevCosts,
        [typeId]: Math.ceil(cost * fishermanType.costIncreaseFactor),
      }));

      toast({ title: "Fisherman Hired!", description: `You hired a ${fishermanType.name}.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(cost).toLocaleString('en-US')} fish to hire.`, variant: "destructive" });
    }
  };

  const handleUpgradeFishermanType = (typeId: string) => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    const currentTypeState = ownedFishermanTypes[typeId];

    if (!fishermanType || !currentTypeState || currentTypeState.quantity === 0) return;

    const crewUpgradeCost = currentTypeState.currentCrewUpgradeCost;

    if (fish >= crewUpgradeCost) {
      setFish(prevFish => prevFish - crewUpgradeCost);
      
      setOwnedFishermanTypes(prevTypes => ({
        ...prevTypes,
        [typeId]: {
          ...currentTypeState,
          level: currentTypeState.level + 1,
          currentCrewUpgradeCost: Math.ceil(currentTypeState.currentCrewUpgradeCost * fishermanType.upgradeCostIncreaseFactor),
        },
      }));

      toast({ title: `${fishermanType.name} Crew Upgraded!`, description: `Your ${fishermanType.name} crew is now level ${currentTypeState.level + 1}.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(crewUpgradeCost).toLocaleString('en-US')} fish to upgrade your ${fishermanType.name} crew.`, variant: "destructive" });
    }
  };

  const handlePurchaseGlobalUpgrade = (upgradeId: string) => {
    const upgradeData = GLOBAL_UPGRADES_DATA.find(up => up.id === upgradeId);
    if (!upgradeData || purchasedUpgrades[upgradeId]) return;

    if (fish >= upgradeData.cost) {
      setFish(prevFish => prevFish - upgradeData.cost);
      setPurchasedUpgrades(prev => ({ ...prev, [upgradeId]: true }));
      setGlobalRateMultiplier(prev => prev * (1 + upgradeData.rateMultiplierIncrease));
      toast({ title: "Upgrade Purchased!", description: `${upgradeData.name} is now active.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${upgradeData.cost.toLocaleString('en-US')} fish for this upgrade.`, variant: "destructive" });
    }
  };

 const handlePurchaseMinigameUpgrade = (upgradeId: string) => {
    const upgradeData = MINIGAME_UPGRADES_DATA.find(up => up.id === upgradeId);
    if (!upgradeData) return;

    const currentLevel = minigameUpgradeLevels[upgradeId] || 1;
    if (upgradeData.maxLevel && currentLevel >= upgradeData.maxLevel) {
      toast({ title: "Max Level Reached", description: `${upgradeData.name} is already at its maximum level.`, variant: "default" });
      return;
    }

    const cost = nextMinigameUpgradeCosts[upgradeId] || upgradeData.initialCost;

    if (fish >= cost) {
      setFish(prevFish => prevFish - cost);
      
      const newLevel = currentLevel + 1;
      setMinigameUpgradeLevels(prevLevels => ({
        ...prevLevels,
        [upgradeId]: newLevel,
      }));

      setNextMinigameUpgradeCosts(prevCosts => ({
        ...prevCosts,
        [upgradeId]: Math.ceil(cost * upgradeData.costIncreaseFactor),
      }));

      switch (upgradeData.effect.type) {
        case 'maxFish':
          setMinigameMaxFish(prev => prev + upgradeData.effect.value);
          break;
        case 'lifetime':
          setMinigameFishLifetime(prev => prev + upgradeData.effect.value);
          break;
        case 'value':
          setMinigameFishValue(prev => prev + upgradeData.effect.value);
          break;
      }
      toast({ title: "Minigame Upgrade Purchased!", description: `${upgradeData.name} upgraded to Level ${newLevel}.`, variant: "default" });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${cost.toLocaleString('en-US')} fish for this upgrade.`, variant: "destructive" });
    }
  };
  
  const resetGame = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear game state from localStorage during reset:", error);
      }
    }
    initializeGameState(true); // forceReset to ensure defaults are set
    toast({ title: "Game Reset", description: "You're starting fresh!", variant: "default"});
  };

  const handleMinigameFishCaught = useCallback((caughtValue: number) => {
    setFish(prevFish => prevFish + caughtValue);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 space-y-6 bg-background text-foreground">
      
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        <div className="flex flex-col space-y-4 items-center md:items-start md:col-span-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center md:text-left" style={{ color: 'hsl(var(--primary-foreground))', WebkitTextStroke: '1px hsl(var(--primary))', textShadow:'2px 2px 4px hsla(var(--primary), 0.5)'}}>
            Fish World Tycoon
          </h1>
          <FishDisplay fishCount={fish} fishPerSecond={totalFishPerSecond} />
        </div>

        <div className="flex justify-center w-full md:col-span-3">
          <ClickableFishGame 
            onFishCaught={handleMinigameFishCaught}
            maxFishOnScreen={minigameMaxFish}
            fishLifetimeMs={minigameFishLifetime}
            fishValueOnClick={minigameFishValue}
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
                      globalRateMultiplier={globalRateMultiplier}
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
                {MINIGAME_UPGRADES_DATA.map(upgrade => {
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
