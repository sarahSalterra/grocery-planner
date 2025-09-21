import { useAppState } from '@state/AppState';

export function PantryCheck() {
  const { state, dispatch } = useAppState();
  const items = state.pantryCheck;
  const toggleItem = (index: number) => {
    const current = items[index];
    dispatch({ type: 'updatePantryCheck', index, haveEnough: !current.haveEnough });
  };
  const allAnswered = true; // checklist UX, always allow continue
  const nextStep = 5;

  return (
    <div className="card">
      <div className="h2">Check your pantry</div>
      <div className="muted" style={{ marginBottom: 8 }}>Confirm if you already have these ingredients and enough amount.</div>
      <div className="muted" style={{ marginBottom: 8 }}>Check items you already have enough of. Unchecked items will be added to your grocery list.</div>
      <div className="list">
        {items.map((i, idx) => (
          <label key={idx} className="list-item" style={{ cursor: 'pointer' }}>
            <div>
              <div><strong>{i.ingredient.name}</strong> — {i.ingredient.amount} {i.ingredient.unit}</div>
              <div className="meta">{i.ingredient.genre}</div>
            </div>
            <input type="checkbox" checked={i.haveEnough === true} onChange={() => toggleItem(idx)} />
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
        <button className="btn primary" disabled={!allAnswered} onClick={() => dispatch({ type: 'goToStep', step: nextStep })}>Next: Restock</button>
      </div>
    </div>
  );
}


