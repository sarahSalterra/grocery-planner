import { useMemo, useState } from 'react';
import { useAppState } from '@state/AppState';
import { MEALS } from '@data/meals';
import { aggregateIngredients, aggregateIngredientArray } from '@utils/aggregate';
import { PANTRY_INVENTORY, HOUSEHOLD_INVENTORY } from '@data/inventory';
import { Genre } from '@types';

export function FinalList() {
  const { state, dispatch } = useAppState();
  const [checkedAll, setCheckedAll] = useState<Set<string>>(new Set());

  const { mealsSelected, dessertsSelected } = useMemo(() => {
    const mealIds = new Set<string>();
    for (const d of state.selection.days) {
      if (d.mainMealId) mealIds.add(d.mainMealId);
      for (const s of d.sideMealIds) mealIds.add(s);
    }
    const meals = MEALS.filter((m) => mealIds.has(m.id));
    const desserts = MEALS.filter((m) => state.selection.dessertMealIds.includes(m.id));
    return { mealsSelected: meals, dessertsSelected: desserts };
  }, [state.selection]);

  const mealsAgg = useMemo(() => aggregateIngredients(mealsSelected), [mealsSelected]);
  const dessertsAgg = useMemo(() => aggregateIngredients(dessertsSelected), [dessertsSelected]);
  const extraIngredients = useMemo(() => state.selection.days.flatMap((d) => d.sideExtraIngredients), [state.selection.days]);
  const totalAgg = useMemo(() => aggregateIngredientArray([...mealsAgg, ...dessertsAgg, ...extraIngredients]), [mealsAgg, dessertsAgg, extraIngredients]);

  const pantrySet = useMemo(() => new Set(PANTRY_INVENTORY.map((p) => `${p.name}`.toLowerCase())), []);
  const genreOrder: Genre[] = ['international','produce','deli','bakery','pantry','baking','butchery','frozen','dairy','snacks','beverages'];
  const genreIndex = (g: string) => {
    const i = genreOrder.indexOf(g as Genre);
    return i === -1 ? 999 : i;
  };

  // 1) Ingredients from inventory list that user marked missing
  const inventoryMissing = state.pantryCheck.filter((i) => i.haveEnough === false);

  // 2) Non-inventory ingredients (definitely need to buy all)
  const mealsNonInventory = mealsAgg.filter((ing) => !pantrySet.has(ing.name.toLowerCase()));
  const dessertsNonInventory = dessertsAgg.filter((ing) => !pantrySet.has(ing.name.toLowerCase()));

  // 3) Household restock selections
  // Restock checklist: checked means user HAS it; we only include those NOT checked
  const restockItems = HOUSEHOLD_INVENTORY.filter((h) => !state.restockSelectedIds.includes(h.id));

  // Normalize household categories to align where possible with genre ordering
  const mapCategoryToGenre = (cat: string): string => cat;

  type CombinedItem = {
    key: string;
    name: string;
    genre: string;
    amount?: number;
    unit?: string;
    type: 'ingredient' | 'household';
  };

  // Build excluded set for pantry-covered ingredients (user has enough)
  const pantryExcludedKeys = new Set(
    state.pantryCheck
      .filter((i) => i.haveEnough === true)
      .map((i) => `${i.ingredient.name.toLowerCase()}__${i.ingredient.unit.toLowerCase()}`)
  );

  // Build from a single source of truth: totalAgg (recipes + extras)
  const pantryMissingKeySet = new Set(
    state.pantryCheck
      .filter((i) => i.haveEnough === false)
      .map((i) => `${i.ingredient.name.toLowerCase()}__${i.ingredient.unit.toLowerCase()}`)
  );

  const mergedIngredientsMap = new Map<string, CombinedItem>();
  for (const i of totalAgg) {
    const nameKey = i.name.toLowerCase();
    const key = `ing:${nameKey}::${i.unit.toLowerCase()}`;
    const isPantry = pantrySet.has(nameKey);
    const include = isPantry ? pantryMissingKeySet.has(`${nameKey}__${i.unit.toLowerCase()}`) : true;
    if (!include) continue;
    mergedIngredientsMap.set(key, {
      key,
      name: i.name,
      genre: i.genre,
      amount: i.amount,
      unit: i.unit,
      type: 'ingredient',
    });
  }

  // 3) Household restock (unchecked = needs to buy)
  // Merge household items with ingredient items when names match (case-insensitive)
  const mergedIngredientsByName = new Map<string, CombinedItem>();
  for (const item of mergedIngredientsMap.values()) {
    mergedIngredientsByName.set(item.name.toLowerCase(), item);
  }

  const householdItems: CombinedItem[] = restockItems.map((h) => {
    const nameKey = h.name.toLowerCase();
    const existing = mergedIngredientsByName.get(nameKey);
    if (existing) {
      // If an ingredient with same name exists, prefer the ingredient row; do not duplicate
      // Optionally could tag it, but we keep one line item
      return { ...existing };
    }
    return {
      key: `hh:${h.id}`,
      name: h.name,
      genre: mapCategoryToGenre(h.category),
      type: 'household' as const,
    };
  });

  const combinedList: CombinedItem[] = [...Array.from(mergedIngredientsMap.values())]
    .concat(
      householdItems.filter((h) => !mergedIngredientsByName.has(h.name.toLowerCase()))
    )
    .sort((a, b) => genreIndex(a.genre) - genreIndex(b.genre) || a.name.localeCompare(b.name));

  const clearAll = () => dispatch({ type: 'resetAll' });

  return (
    <div className="grid cols-1">
      <div className="card">
        <div className="h2">Grocery list</div>
        <div className="list" style={{ marginTop: 8 }}>
          {(() => {
            const visible = combinedList.filter((i) => !checkedAll.has(i.key));
            if (visible.length === 0) return <div className="muted">Nothing to buy</div>;
            let lastGenre: string | null = null;
            return visible.map((item) => {
              const headerNeeded = item.genre !== lastGenre;
              lastGenre = item.genre;
              return (
                <>
                  {headerNeeded && <div className="genre-sep" key={`h:${item.genre}`}>{item.genre}</div>}
                  <label key={item.key} className="list-item" style={{ cursor: 'pointer' }}>
                    <div>
                      <div><strong>{item.name}</strong></div>
                      <div className="meta">{item.type === 'ingredient' && item.amount !== undefined ? `${item.amount} ${item.unit}` : ''}</div>
                    </div>
                    <input type="checkbox" checked={checkedAll.has(item.key)} onChange={() => setCheckedAll((prev) => { const next = new Set(prev); next.add(item.key); return next; })} />
                  </label>
                </>
              );
            });
          })()}
        </div>
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={clearAll}>Start over</button>
        </div>
      </div>
    </div>
  );
}


