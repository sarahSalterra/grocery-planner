import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { AppStateShape, DayPlan, Mode, PantryCheckItem, SelectionState } from '@types';

type Action =
  | { type: 'setMode'; mode: Mode }
  | { type: 'goToStep'; step: number }
  | { type: 'setNumDays'; numDays: number }
  | { type: 'setMainForDay'; dayIndex: number; mealId?: string }
  | { type: 'addSideForDay'; dayIndex: number; mealId: string }
  | { type: 'removeSideForDay'; dayIndex: number; mealId: string }
  | { type: 'addSideExtraIngredient'; dayIndex: number; ingredient: PantryCheckItem['ingredient'] }
  | { type: 'removeSideExtraIngredient'; dayIndex: number; name: string; unit: string }
  | { type: 'removeMealSlot'; dayIndex: number }
  | { type: 'setDessertSelections'; mealIds: string[] }
  | { type: 'setPantryCheck'; items: PantryCheckItem[] }
  | { type: 'updatePantryCheck'; index: number; haveEnough: boolean }
  | { type: 'setRestockSelected'; ids: string[] }
  | { type: 'resetAll' };

const initialSelection: SelectionState = {
  numDays: 3,
  days: Array.from({ length: 3 }).map<DayPlan>(() => ({ mainMealId: undefined, sideMealIds: [], sideExtraIngredients: [] })),
  dessertMealIds: [],
};

const initialState: AppStateShape = {
  mode: 'meal',
  step: 0,
  selection: initialSelection,
  pantryCheck: [],
  restockSelectedIds: [],
};

function ensureDaysLength(selection: SelectionState, numDays: number): SelectionState {
  const days = selection.days.slice(0, numDays).map((d) => ({
    mainMealId: d.mainMealId,
    sideMealIds: d.sideMealIds || [],
    sideExtraIngredients: d.sideExtraIngredients || [],
  }));
  while (days.length < numDays) days.push({ mainMealId: undefined, sideMealIds: [], sideExtraIngredients: [] });
  return { ...selection, numDays, days };
}

function reducer(state: AppStateShape, action: Action): AppStateShape {
  switch (action.type) {
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'goToStep':
      return { ...state, step: action.step };
    case 'setNumDays':
      return { ...state, selection: ensureDaysLength(state.selection, Math.max(1, Math.min(14, action.numDays))) };
    case 'setMainForDay': {
      const days = state.selection.days.map((d, i) => (i === action.dayIndex ? { ...d, mainMealId: action.mealId } : d));
      return { ...state, selection: { ...state.selection, days } };
    }
    case 'addSideForDay': {
      const days = state.selection.days.map((d, i) => {
        if (i !== action.dayIndex) return d;
        if (d.sideMealIds.includes(action.mealId)) return d;
        return { ...d, sideMealIds: [...d.sideMealIds, action.mealId] };
      });
      return { ...state, selection: { ...state.selection, days } };
    }
    case 'removeSideForDay': {
      const days = state.selection.days.map((d, i) => (i === action.dayIndex ? { ...d, sideMealIds: d.sideMealIds.filter((id) => id !== action.mealId) } : d));
      return { ...state, selection: { ...state.selection, days } };
    }
    case 'removeMealSlot': {
      const days = state.selection.days.filter((_, i) => i !== action.dayIndex);
      if (days.length === 0) days.push({ mainMealId: undefined, sideMealIds: [], sideExtraIngredients: [] });
      return { ...state, selection: { ...state.selection, days, numDays: days.length } };
    }
    case 'addSideExtraIngredient': {
      const days = state.selection.days.map((d, i) => {
        if (i !== action.dayIndex) return d;
        const key = `${action.ingredient.name}__${action.ingredient.unit}`.toLowerCase();
        const exists = d.sideExtraIngredients.some((ing) => `${ing.name}__${ing.unit}`.toLowerCase() === key);
        if (exists) return d;
        return { ...d, sideExtraIngredients: [...d.sideExtraIngredients, action.ingredient] };
      });
      return { ...state, selection: { ...state.selection, days } };
    }
    case 'removeSideExtraIngredient': {
      const days = state.selection.days.map((d, i) => {
        if (i !== action.dayIndex) return d;
        return { ...d, sideExtraIngredients: d.sideExtraIngredients.filter((ing) => !(ing.name === action.name && ing.unit === action.unit)) };
      });
      return { ...state, selection: { ...state.selection, days } };
    }
    
    case 'setDessertSelections':
      return { ...state, selection: { ...state.selection, dessertMealIds: action.mealIds } };
    case 'setPantryCheck':
      return { ...state, pantryCheck: action.items };
    case 'updatePantryCheck': {
      const next = state.pantryCheck.slice();
      next[action.index] = { ...next[action.index], haveEnough: action.haveEnough };
      return { ...state, pantryCheck: next };
    }
    case 'setRestockSelected':
      return { ...state, restockSelectedIds: action.ids };
    case 'resetAll':
      return initialState;
    default:
      return state;
  }
}

const AppStateContext = createContext<{ state: AppStateShape; dispatch: React.Dispatch<Action> } | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  // Start fresh every load (no persistence)
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}


