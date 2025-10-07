import { useMemo, useState } from 'react';
import { useAppState } from '@state/AppState';
import { MEALS } from '@data/meals';

type Match = {
  id: string;
  name: string;
  description: string;
  contains: string[];
  isDessertOrExtra: boolean;
};

export function UseUpItems() {
  const { state, dispatch } = useAppState();
  const [query, setQuery] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const [results, setResults] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const normalizedMeals = useMemo(() => {
    return MEALS.map((m) => ({
      ...m,
      _ingredientNames: m.ingredients.map((i) => i.name.toLowerCase()),
    }));
  }, []);

  const runSearch = () => {
    const raw = query.split(/[,;\n]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    const uniq = Array.from(new Set(raw));
    setTerms(uniq);

    const matched: Match[] = [];
    for (const m of normalizedMeals) {
      const contains = uniq.filter((t) => m._ingredientNames.some((n: string) => n.includes(t)));
      if (contains.length > 0) {
        matched.push({
          id: m.id,
          name: m.name,
          description: m.description,
          contains,
          isDessertOrExtra: m.dishType === 'dessert' || Boolean(m.extraType),
        });
      }
    }
    matched.sort((a, b) => b.contains.length - a.contains.length || a.name.localeCompare(b.name));
    setResults(matched);
    setSelected(new Set());
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const continueToMealPlanning = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      dispatch({ type: 'goToStep', step: 2 });
      return;
    }
    const chosen = MEALS.filter((m) => ids.includes(m.id));
    const dessertIds = chosen.filter((m) => m.dishType === 'dessert' || Boolean(m.extraType)).map((m) => m.id);
    const mealIds = chosen.filter((m) => !(m.dishType === 'dessert' || Boolean(m.extraType))).map((m) => m.id);

    const dessertSet = new Set(state.selection.dessertMealIds);
    for (const d of dessertIds) dessertSet.add(d);
    dispatch({ type: 'setDessertSelections', mealIds: Array.from(dessertSet) });

    if (mealIds.length > 0) {
      dispatch({ type: 'prepopulateMains', mealIds });
    }
    dispatch({ type: 'goToStep', step: 2 });
  };

  return (
    <div className="grid cols-1">
      <div className="card">
        <div className="h2">Use up items</div>
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <input
            placeholder="Enter items (comma separated)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={runSearch}>Search</button>
        </div>
        {terms.length > 0 && (
          <div className="muted" style={{ marginTop: 8 }}>
            Searching for: {terms.join(', ')}
          </div>
        )}
        <div className="list" style={{ marginTop: 12 }}>
          {results.length === 0 ? (
            <div className="muted">No matches yet. Enter items and click Search.</div>
          ) : (
            results.map((r) => (
              <label key={r.id} className="list-item" style={{ cursor: 'pointer' }}>
                <div>
                  <div><strong>{r.name}</strong></div>
                  <div className="meta">
                    contains: {r.contains.join(', ')}
                    {r.isDessertOrExtra ? ' • (dessert/snack)' : ''}
                  </div>
                </div>
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
              </label>
            ))
          )}
        </div>
        <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={continueToMealPlanning}>Continue</button>
        </div>
      </div>
    </div>
  );
}