import { useMemo, useState } from 'react';
import { useAppState } from '@state/AppState';
import { MEALS } from '@data/meals';
import { Difficulty, PriceLevel, TimeIntensity, ExtraType } from '@types';
import { aggregateIngredients, toPantryCheckItems } from '@utils/aggregate';

type Filters = {
  price?: PriceLevel | 'any';
  difficulty?: Difficulty | 'any';
  timeIntensity?: TimeIntensity | 'any';
  type?: ExtraType | 'any';
};

export function DessertsPlanning() {
  const { state, dispatch } = useAppState();
  const [filters, setFilters] = useState<Filters>({ price: 'any', difficulty: 'any', timeIntensity: 'any', type: 'dessert' });
  // Pool includes all desserts and any items explicitly tagged with an extraType (e.g., snacks, breakfast, beverages),
  // including side dishes or desserts that carry an extraType.
  const extrasPool = useMemo(() => MEALS.filter((m) => m.dishType === 'dessert' || Boolean(m.extraType)), []);
  const filtered = useMemo(() => extrasPool.filter((d) => {
    if (filters.price && filters.price !== 'any' && d.priceLevel !== filters.price) return false;
    if (filters.difficulty && filters.difficulty !== 'any' && d.difficulty !== filters.difficulty) return false;
    if (filters.timeIntensity && filters.timeIntensity !== 'any' && d.timeIntensity !== filters.timeIntensity) return false;
    // Type filtering:
    // - 'dessert' type shows anything with dishType === 'dessert' (regardless of extraType)
    // - other types show items whose extraType matches exactly
    if (!filters.type || filters.type === 'any') return true;
    if (filters.type === 'dessert') return d.dishType === 'dessert';
    return d.extraType === filters.type;
  }), [filters, extrasPool]);

  const toggle = (id: string) => {
    const set = new Set(state.selection.dessertMealIds);
    if (set.has(id)) set.delete(id); else set.add(id);
    dispatch({ type: 'setDessertSelections', mealIds: Array.from(set) });
  };

  const goToCombinedPantry = () => {
    // Combined pantry will be constructed in App when we reach the Pantry step.
    dispatch({ type: 'goToStep', step: 3 });
  };

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="h2">Extras & Baking (optional)</div>
        <div className="list" style={{ marginTop: 8 }}>
          {filtered.map((d) => (
            <label key={d.id} className="list-item" style={{ cursor: 'pointer' }}>
              <div>
                <div><strong>{d.name}</strong></div>
                <div className="meta">{d.description}</div>
              </div>
              <input type="checkbox" checked={state.selection.dessertMealIds.includes(d.id)} onChange={() => toggle(d.id)} />
            </label>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={goToCombinedPantry}>Next: Pantry</button>
        </div>
      </div>

      <div className="card">
        <div className="h2">Filter desserts</div>
        <div className="filters-compact" style={{ marginTop: 8 }}>
          <div className="field inline">
            <div className="label">Cost</div>
            <select className="control-sm" value={filters.price} onChange={(e) => setFilters((f) => ({ ...f, price: e.target.value as Filters['price'] }))}>
              <option value="any">Any</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </div>
          <div className="field inline">
            <div className="label">Diff</div>
            <select className="control-sm" value={filters.difficulty} onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value as Filters['difficulty'] }))}>
              <option value="any">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="field inline">
            <div className="label">Time</div>
            <select className="control-sm" value={filters.timeIntensity} onChange={(e) => setFilters((f) => ({ ...f, timeIntensity: e.target.value as Filters['timeIntensity'] }))}>
              <option value="any">Any</option>
              <option value="quick">Quick</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <div className="field inline">
            <div className="label">Type</div>
            <select className="control-sm" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters['type'] }))}>
              <option value="any">Any</option>
              <option value="dessert">Dessert</option>
              <option value="snack">Snack</option>
              <option value="breakfast">Breakfast</option>
              <option value="beverages">Beverages</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}


