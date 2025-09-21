import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '@state/AppState';
import { HOUSEHOLD_INVENTORY } from '@data/inventory';

export function RestockStep() {
  const { state, dispatch } = useAppState();
  const [query, setQuery] = useState('');

  // Initialize as checked (have it) for all items; user will uncheck missing ones
  useEffect(() => {
    if (state.restockSelectedIds.length === 0) {
      dispatch({ type: 'setRestockSelected', ids: HOUSEHOLD_INVENTORY.map((i) => i.id) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HOUSEHOLD_INVENTORY.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  const toggle = (id: string) => {
    const set = new Set(state.restockSelectedIds);
    if (set.has(id)) set.delete(id); else set.add(id);
    dispatch({ type: 'setRestockSelected', ids: Array.from(set) });
  };

  return (
    <div className="card">
      <div className="h2">Restock your home</div>
      <div className="row" style={{ marginTop: 8 }}>
        <input placeholder="Search items..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="muted" style={{ marginTop: 8, marginBottom: 8 }}>Items are checked by default. Uncheck anything you need to restock.</div>
      <div className="list">
        {filtered.map((i) => (
          <label key={i.id} className="list-item" style={{ cursor: 'pointer' }}>
            <div>
              <div><strong>{i.name}</strong></div>
              <div className="meta">{i.category}</div>
            </div>
            <input type="checkbox" checked={state.restockSelectedIds.includes(i.id)} onChange={() => toggle(i.id)} />
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={() => dispatch({ type: 'goToStep', step: 6 })}>Next: Final list</button>
      </div>
    </div>
  );
}


