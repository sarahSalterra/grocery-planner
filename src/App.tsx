import { useAppState } from '@state/AppState';
import { Stepper } from '@components/Stepper';
import { ModeSelector } from '@components/ModeSelector';
import { MealPlanning } from '@components/MealPlanning';
import { PantryCheck } from '@components/PantryCheck';
import { DessertsPlanning } from '@components/DessertsPlanning';
import { RestockStep } from '@components/RestockStep';
import { FinalList } from '@components/FinalList';
import { useEffect, useMemo } from 'react';
import { MEALS } from '@data/meals';
import { PANTRY_INVENTORY } from '@data/inventory';
import { aggregateIngredients, toPantryCheckItems, aggregateIngredientArray } from '@utils/aggregate';

export default function App() {
  const { state, dispatch } = useAppState();
  // Build combined pantry items when we land on Pantry step
  const pantryBootstrap = useMemo(() => {
    if (state.step !== 3) return null;
    const mealIds = new Set<string>();
    for (const d of state.selection.days) {
      if (d.mainMealId) mealIds.add(d.mainMealId);
      for (const s of d.sideMealIds) mealIds.add(s);
    }
    const selectedMeals = MEALS.filter((m) => mealIds.has(m.id));
    const selectedDesserts = MEALS.filter((m) => state.selection.dessertMealIds.includes(m.id));
    const aggMeals = aggregateIngredients([...selectedMeals, ...selectedDesserts]);
    const extraIngredients = state.selection.days.flatMap((d) => d.sideExtraIngredients);
    const combinedAgg = aggregateIngredientArray([...aggMeals, ...extraIngredients]);
    // Only include items that are in the user's typical pantry inventory
    const pantrySet = new Set(PANTRY_INVENTORY.map((p) => p.name.toLowerCase()));
    const pantryOnly = combinedAgg.filter((ing) => pantrySet.has(ing.name.toLowerCase()));
    return toPantryCheckItems(pantryOnly);
  }, [state.step, state.selection]);

  useEffect(() => {
    if (state.step === 3 && pantryBootstrap) {
      dispatch({ type: 'setPantryCheck', items: pantryBootstrap });
    }
  }, [state.step, pantryBootstrap, dispatch]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">Grocery Planner</div>
        <div className="subtitle">Smart meal planning and restocking, all local.</div>
      </header>

      <main className="app-main">
        <Stepper />
        <div className="step-content">
          {state.step === 0 && <ModeSelector />}
          {state.step === 1 && state.mode === 'meal' && <MealPlanning />}
          {state.step === 2 && state.mode === 'meal' && <DessertsPlanning />}
          {state.step === 3 && <PantryCheck />}
          {state.step === 5 && <RestockStep />}
          {state.step === 6 && <FinalList />}
        </div>
      </main>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Grocery Planner</span>
      </footer>
    </div>
  );
}


