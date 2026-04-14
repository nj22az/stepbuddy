// Step 3 — Standard, Accuracy class, Mode, Reversibility, run count.

import { STANDARDS, MODES } from '../test'

export function StandardScreen({ test, patch }) {
  const s = test.standard
  const setS = (k, v) => patch({ standard: { ...s, [k]: v } })
  const std = STANDARDS[s.id]

  return (
    <section className="section">
      <h2 className="section-header">Standard &amp; method</h2>
      <div className="card">
        <div className="card-row">
          <label className="card-row-label" htmlFor="std-id">Standard</label>
          <select id="std-id" className="input input--select meta-input"
            value={s.id} onChange={e => {
              const next = e.target.value
              const cls = STANDARDS[next].classes[0]
              setS('id', next)
              patch({ standard: { ...s, id: next, accuracyClass: cls } })
            }}>
            {Object.entries(STANDARDS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="card-row">
          <label className="card-row-label" htmlFor="std-class">Accuracy class</label>
          <select id="std-class" className="input input--select meta-input"
            value={s.accuracyClass} onChange={e => setS('accuracyClass', e.target.value)}>
            {std.classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="card-row">
          <label className="card-row-label" htmlFor="std-mode">Mode</label>
          <select id="std-mode" className="input input--select meta-input"
            value={s.mode} onChange={e => setS('mode', e.target.value)}>
            {MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="card-row">
          <label className="card-row-label">Reversibility</label>
          <div className="kgf-mode-toggle">
            <button type="button"
              className={`kgf-mode-btn${!s.reversibility ? ' kgf-mode-btn--active' : ''}`}
              onClick={() => setS('reversibility', false)}>No</button>
            <button type="button"
              className={`kgf-mode-btn${s.reversibility ? ' kgf-mode-btn--active' : ''}`}
              onClick={() => setS('reversibility', true)}>Yes</button>
          </div>
        </div>
        <div className="card-row">
          <label className="card-row-label" htmlFor="std-runs">Number of runs</label>
          <select id="std-runs" className="input input--select meta-input"
            value={s.runs} onChange={e => setS('runs', parseInt(e.target.value))}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="card-row">
          <label className="card-row-label" htmlFor="ref-class">Reference standard class</label>
          <select id="ref-class" className="input input--select meta-input"
            value={s.referenceClass} onChange={e => setS('referenceClass', e.target.value)}>
            {['0.5', '1', '2', '3'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
      </div>
      <p className="section-footer">
        Class drives the tolerance bands used to colour-code Verify rows. {test.standard.runs} run{test.standard.runs > 1 ? 's' : ''} per point will be recorded.
      </p>
    </section>
  )
}
