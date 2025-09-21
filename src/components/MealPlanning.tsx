import { useMemo, useState } from 'react';
import { useAppState } from '@state/AppState';
import { MEALS } from '@data/meals';
import { DishType, Meal, MeatType, PriceLevel, Difficulty, TimeIntensity } from '@types';
import { aggregateIngredients, toPantryCheckItems } from '@utils/aggregate';

type Filters = {
  price?: PriceLevel | 'any';
  difficulty?: Difficulty | 'any';
  timeIntensity?: TimeIntensity | 'any';
  cuisine?: string | 'any';
  meatType?: MeatType | 'any';
  dishType?: DishType | 'any';
};

const cuisines = Array.from(new Set(MEALS.map((m) => m.cuisine === 'Russian' ? 'Slavic' : m.cuisine))).sort();

export function MealPlanning() {
  const { state, dispatch } = useAppState();
  const [filters, setFilters] = useState<Filters>({ price: 'any', difficulty: 'any', timeIntensity: 'any', cuisine: 'any', meatType: 'any', dishType: 'main' });

  const filtered = useMemo(() => {
    return MEALS.filter((m) => {
      if (filters.price && filters.price !== 'any' && m.priceLevel !== filters.price) return false;
      if (filters.difficulty && filters.difficulty !== 'any' && m.difficulty !== filters.difficulty) return false;
      if (filters.timeIntensity && filters.timeIntensity !== 'any' && m.timeIntensity !== filters.timeIntensity) return false;
      if (filters.cuisine && filters.cuisine !== 'any' && m.cuisine !== filters.cuisine) return false;
      if (filters.meatType && filters.meatType !== 'any' && m.meatType !== filters.meatType) return false;
      if (filters.dishType && filters.dishType !== 'any' && m.dishType !== filters.dishType) return false;
      return true;
    });
  }, [filters]);

  const sides = MEALS.filter((m) => m.dishType === 'side');

  const totalTimeForDay = (dayIndex: number) => {
    const day = state.selection.days[dayIndex];
    const selectedMeals: Meal[] = [];
    if (day.mainMealId) {
      const mm = MEALS.find((m) => m.id === day.mainMealId);
      if (mm) selectedMeals.push(mm);
    }
    for (const id of day.sideMealIds) {
      const sm = MEALS.find((m) => m.id === id);
      if (sm) selectedMeals.push(sm);
    }
    // ingredient-only sides do not add to time estimate
    if (selectedMeals.length === 0) return 0;
    // If multitaskable, assume concurrent cooking: take max time of multitaskable group; otherwise sum
    const nonMulti = selectedMeals.filter((m) => !m.multitaskable);
    const multi = selectedMeals.filter((m) => m.multitaskable);
    const nonMultiSum = nonMulti.reduce((s, m) => s + m.timeMinutes, 0);
    const multiMax = multi.reduce((max, m) => Math.max(max, m.timeMinutes), 0);
    return nonMultiSum + multiMax;
  };

  const continueToDesserts = () => {
    const selected: Meal[] = [];
    for (const day of state.selection.days) {
      if (day.mainMealId) {
        const main = MEALS.find((m) => m.id === day.mainMealId);
        if (main) selected.push(main);
      }
      for (const id of day.sideMealIds) {
        const side = MEALS.find((m) => m.id === id);
        if (side) selected.push(side);
      }
    }
    // include ingredient-only side extras in aggregation
    const extraIngredients = state.selection.days.flatMap((d) => d.sideExtraIngredients);
    const aggregated = aggregateIngredients(selected);
    // merge extra ingredients into pantry check items
    const combined = toPantryCheckItems([...aggregated, ...extraIngredients]);
    // Temporarily stash combined (meals + extras); desserts will be added after selection
    dispatch({ type: 'setPantryCheck', items: combined });
    dispatch({ type: 'goToStep', step: 2 });
  };

  const assignMainToNextAvailable = (mealId: string) => {
    let nextIndex = state.selection.days.findIndex((d) => !d.mainMealId);
    if (nextIndex === -1) {
      if (state.selection.days.length >= 7) return;
      dispatch({ type: 'setNumDays', numDays: state.selection.days.length + 1 });
      nextIndex = state.selection.days.length;
    }
    dispatch({ type: 'setMainForDay', dayIndex: nextIndex, mealId });
  };

  const getMealName = (id?: string) => {
    if (!id) return '';
    const m = MEALS.find((x) => x.id === id);
    return m?.name || '';
  };

  const allDaysHaveAtLeastOne = state.selection.days.some((d) => Boolean(d.mainMealId));
  const selectedDays = state.selection.days
    .map((d, idx) => ({ d, idx }))
    .filter(({ d }) => Boolean(d.mainMealId) || d.sideMealIds.length > 0 || d.sideExtraIngredients.length > 0);

  return (
    <div className="grid cols-2">
      {/* Meal options first (scrollable ~3 items) */}
      <div className="card">
        <div className="h2">Meal options</div>
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
            <div className="label">Cuisine</div>
            <select className="control-sm" value={filters.cuisine} onChange={(e) => setFilters((f) => ({ ...f, cuisine: e.target.value as Filters['cuisine'] }))}>
              <option value="any">Any</option>
              {cuisines.map((c0) => {
                const c = c0 === 'Russian' ? 'Slavic' : c0;
                if (c === 'Chinese') return null; // folded under broader 'Asian'
                return (
                <option key={c} value={c}>{c}</option>
                );
              })}
            </select>
          </div>
          <div className="field inline">
            <div className="label">Meat</div>
            <select className="control-sm" value={filters.meatType} onChange={(e) => setFilters((f) => ({ ...f, meatType: e.target.value as Filters['meatType'] }))}>
              <option value="any">Any</option>
              <option value="beef">Beef</option>
              <option value="chicken">Chicken</option>
              <option value="pork">Pork</option>
              <option value="seafood">Seafood</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="field inline">
            <div className="label">Dish</div>
            <select className="control-sm" value={filters.dishType} onChange={(e) => setFilters((f) => ({ ...f, dishType: e.target.value as Filters['dishType'] }))}>
              <option value="any">Any</option>
              <option value="main">Main</option>
              <option value="side">Side</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>
        </div>
        <div className="divider" />
        <div className="list scroll-window">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="list-item meal-card"
              style={{ cursor: m.dishType === 'main' ? 'pointer' : 'default' }}
              onClick={() => {
                if (m.dishType === 'main') assignMainToNextAvailable(m.id);
              }}
            >
              <div>
                <div className="title">{m.name}</div>
                <div className="meta">{m.description}</div>
                <div className="tags" style={{ marginTop: 6 }}>
                  <span className="chip">{m.cuisine}</span>
                  <span className="chip">{m.priceLevel}</span>
                  <span className="chip">{m.difficulty}</span>
                  <span className="chip">{m.timeIntensity}</span>
                  <span className="chip">{m.meatType}</span>
                  <span className="chip">{m.dishType}</span>
                </div>
              </div>
              <div className="actions">
                {m.dishType === 'side' && (
                  <select onChange={(e) => e.target.value && dispatch({ type: 'addSideForDay', dayIndex: Number(e.target.value), mealId: m.id })}>
                    <option value="">Add as side to meal...</option>
                    {state.selection.days.map((_, i) => (
                      <option key={i} value={i}>Meal {i + 1}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="btn primary" disabled={!allDaysHaveAtLeastOne} onClick={continueToDesserts}>Next: Extras</button>
        </div>
      </div>

      {/* Meals list second */}
      <div className="card">
        <div className="h2">Meals this week</div>
        <div className="divider" />
        <div className="list">
          {selectedDays.length === 0 && (
            <div className="muted">No meals selected yet</div>
          )}
          {selectedDays.map(({ d: day, idx }, displayIndex) => (
            <div key={idx} className="list-item" style={{ position: 'relative' }}>
              <button className="btn small ghost" style={{ position: 'absolute', top: 6, right: 6 }} onClick={() => dispatch({ type: 'removeMealSlot', dayIndex: idx })}>✕</button>
              <div>
                <div><strong>Meal {displayIndex + 1}</strong></div>
                <div className="meta">Estimated time: {totalTimeForDay(idx)} min</div>
                <div className="row" style={{ marginTop: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <div className="label">Main</div>
                    <div className="list-item" style={{ padding: '8px 10px' }}>
                      <div className="meta">{day.mainMealId ? getMealName(day.mainMealId) : 'Select one below'}</div>
                      {day.mainMealId && (
                        <button className="btn small ghost" onClick={() => dispatch({ type: 'setMainForDay', dayIndex: idx, mealId: undefined })}>Clear</button>
                      )}
                    </div>
                  </div>
                  {day.mainMealId ? (
                    <select onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val.startsWith('m:')) {
                        const mealId = val.slice(2);
                        dispatch({ type: 'addSideForDay', dayIndex: idx, mealId });
                      } else if (val.startsWith('x:')) {
                        const payload = val.slice(2);
                        const [name, unit, amount, genre] = payload.split('::');
                        dispatch({ type: 'addSideExtraIngredient', dayIndex: idx, ingredient: { name, unit: unit as any, amount: Number(amount), genre: genre as any } });
                      }
                    }}>
                      <option value="">Add side...</option>
                      {(() => {
                        const main = MEALS.find((m) => m.id === day.mainMealId);
                        const recIds = new Set(main?.recommendedSideMealIds || []);
                        const mealOptions = sides.filter((s) => recIds.has(s.id));
                        const extraOptions = main?.recommendedSideExtraIngredients || [];
                        return (
                          <>
                            {mealOptions.map((m) => (
                              <option key={`m-${m.id}`} value={`m:${m.id}`}>{m.name}</option>
                            ))}
                            {extraOptions.map((ing, i2) => (
                              <option key={`x-${i2}`} value={`x:${ing.name}::${ing.unit}::${ing.amount}::${ing.genre}`}>{ing.name}</option>
                            ))}
                          </>
                        );
                      })()}
                    </select>
                  ) : (
                    <select disabled>
                      <option>Add side...</option>
                    </select>
                  )}
                </div>
                {(day.sideMealIds.length > 0 || day.sideExtraIngredients.length > 0) && (
                  <div className="row" style={{ marginTop: 6 }}>
                    {day.sideMealIds.map((id) => {
                      const sm = MEALS.find((m) => m.id === id);
                      if (!sm) return null;
                      return (
                        <span key={id} className="chip">
                          {sm.name}
                          <button className="remove" onClick={() => dispatch({ type: 'removeSideForDay', dayIndex: idx, mealId: id })}>✕</button>
                        </span>
                      );
                    })}
                    {day.sideExtraIngredients.map((ing) => (
                      <span key={`${ing.name}::${ing.unit}`} className="chip">
                        {ing.name}
                        <button className="remove" onClick={() => dispatch({ type: 'removeSideExtraIngredient', dayIndex: idx, name: ing.name, unit: ing.unit })}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                {(() => {
                  const hasAnySide = day.sideMealIds.length > 0 || day.sideExtraIngredients.length > 0;
                  const label = day.mainMealId ? (hasAnySide ? 'Complete' : 'No side') : 'No main';
                  const color = !day.mainMealId ? 'danger' : hasAnySide ? 'ok' : 'warn';
                  return (
                    <span className={`chip ${color}`}>{label}</span>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


