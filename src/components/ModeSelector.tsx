import { useAppState } from '@state/AppState';

export function ModeSelector() {
  const { state, dispatch } = useAppState();
  return (
    <div className="card" role="region" aria-label="Mode selection" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', height: 'calc(100vh - 180px)' }}>
        <button className="btn primary" style={{ borderRadius: 0, fontSize: 18 }} onClick={() => { dispatch({ type: 'setMode', mode: 'meal' }); dispatch({ type: 'goToStep', step: 1 }); }}>Meal planning</button>
        <button className="btn" style={{ borderRadius: 0, fontSize: 18 }} onClick={() => { dispatch({ type: 'setMode', mode: 'restock' }); dispatch({ type: 'goToStep', step: 5 }); }}>Restock only</button>
        <button className="btn" style={{ borderRadius: 0, fontSize: 18 }} onClick={() => { dispatch({ type: 'setMode', mode: 'useup-meal' }); dispatch({ type: 'goToStep', step: 1 }); }}>Use up items</button>
        <button className="btn" style={{ borderRadius: 0, fontSize: 18 }} disabled={!state.savedFinalList || state.savedFinalList.length === 0} onClick={() => { dispatch({ type: 'showSavedFinal' }); }}>Previous list</button>
      </div>
    </div>
  );
}


