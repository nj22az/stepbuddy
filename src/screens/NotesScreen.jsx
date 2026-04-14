// Step 6 — Notes: certificate metadata + free-text notes.

import { ACCREDITATION_BODIES, LETTERHEADS, LANGUAGES, generateCertNo } from '../test'

export function NotesScreen({ test, patch }) {
  const n = test.notes
  const set = (k) => (e) => patch({ notes: { ...n, [k]: e.target.value } })

  return (
    <>
      <section className="section">
        <h2 className="section-header">Certificate</h2>
        <div className="card">
          <div className="card-row">
            <label className="card-row-label" htmlFor="cert-no">Certificate no.</label>
            <div className="capacity-picker">
              <input id="cert-no" className="input meta-input" type="text"
                value={n.certNo} onChange={set('certNo')} />
              <button type="button" className="cert-regen"
                onClick={() => patch({ notes: { ...n, certNo: generateCertNo() } })}
                aria-label="Regenerate certificate number">↻</button>
            </div>
          </div>
          <Field id="ref-cert" label="Ref. cert. no." value={n.refCertNo} onChange={set('refCertNo')} />
          <Field id="po-no"    label="P.O. no."       value={n.poNo}      onChange={set('poNo')} />
          <Field id="svc-no"   label="Service order"  value={n.serviceOrderNo} onChange={set('serviceOrderNo')} placeholder="SV2602190057" />
          <div className="card-row">
            <label className="card-row-label">New installation?</label>
            <div className="kgf-mode-toggle">
              <button type="button"
                className={`kgf-mode-btn${!n.newInstallation ? ' kgf-mode-btn--active' : ''}`}
                onClick={() => patch({ notes: { ...n, newInstallation: false } })}>No</button>
              <button type="button"
                className={`kgf-mode-btn${n.newInstallation ? ' kgf-mode-btn--active' : ''}`}
                onClick={() => patch({ notes: { ...n, newInstallation: true } })}>Yes</button>
            </div>
          </div>
          <Field id="start-date" label="Start date" value={n.startDate} onChange={set('startDate')} type="date" />
          <Field id="due-date"   label="Due date"   value={n.dueDate}   onChange={set('dueDate')}   type="date" />
        </div>
      </section>

      <section className="section">
        <h2 className="section-header">Report</h2>
        <div className="card">
          <SelectRow id="acc"  label="Accreditation body" value={n.accreditationBody} onChange={set('accreditationBody')} opts={ACCREDITATION_BODIES} />
          <SelectRow id="lhd"  label="Letterhead"          value={n.letterhead}        onChange={set('letterhead')}        opts={LETTERHEADS} />
          <SelectRow id="lang" label="Language"            value={n.language}          onChange={set('language')}          opts={LANGUAGES} />
        </div>
      </section>

      <section className="section">
        <h2 className="section-header">Free-text notes</h2>
        <div className="card">
          <div className="card-row card-row--stack">
            <textarea className="input meta-textarea" rows="4"
              aria-label="Free-text notes"
              placeholder="Procedure deviations, environmental observations, comments…"
              value={n.freeText} onChange={set('freeText')} />
          </div>
        </div>
      </section>
    </>
  )
}

function Field({ id, label, value, onChange, placeholder, type }) {
  return (
    <div className="card-row">
      <label className="card-row-label" htmlFor={id}>{label}</label>
      <input id={id} className="input meta-input" type={type || 'text'}
        value={value} placeholder={placeholder || ''} onChange={onChange} />
    </div>
  )
}

function SelectRow({ id, label, value, onChange, opts }) {
  return (
    <div className="card-row">
      <label className="card-row-label" htmlFor={id}>{label}</label>
      <select id={id} className="input input--select meta-input" value={value} onChange={onChange}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
