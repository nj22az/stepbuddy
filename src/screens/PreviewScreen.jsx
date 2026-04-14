// Step 7 — Preview: print-ready calibration certificate.
// Triggers window.print(); the @media print styles in print.css strip the
// app chrome and lay out the cert as a clean A4 document.

import { STANDARDS, tolerancesFor, classifyError, repeatError, meanIndicated } from '../test'
import { unitLabel, canConvert, convert } from '../units'

export function PreviewScreen({ test, ranges }) {
  const tol = tolerancesFor(test)
  const today = new Date().toISOString().slice(0, 10)

  const overall = computeOverall(test, ranges, tol)

  return (
    <section className="section preview-screen">
      <div className="preview-actions no-print">
        <button className="btn btn--green" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <span className={`overall-badge overall-badge--${overall.status}`}>
          {overall.status === 'pass' ? '✓ PASS' : overall.status === 'fail' ? '✗ FAIL' : '— Incomplete'}
        </span>
      </div>

      <article className="cert">
        <header className="cert-header">
          <div className="cert-title">Calibration Certificate</div>
          <div className="cert-meta">
            <div><span>Cert. no.</span> <strong>{test.notes.certNo || '—'}</strong></div>
            <div><span>Date</span> <strong>{test.notes.startDate || today}</strong></div>
            <div><span>Standard</span> <strong>{STANDARDS[test.standard.id]?.label || test.standard.id}</strong></div>
            <div><span>Class</span> <strong>{test.standard.accuracyClass}</strong></div>
          </div>
        </header>

        <section className="cert-section">
          <h3>Customer / Site</h3>
          <div className="cert-grid">
            <Field label="Site ID"   value={test.site.siteId} />
            <Field label="Company"   value={test.site.company} />
            <Field label="Address"   value={test.site.address} />
            <Field label="Contact"   value={test.site.contact} />
            <Field label="Email"     value={test.site.email} />
          </div>
        </section>

        <section className="cert-section">
          <h3>Equipment under test</h3>
          <div className="cert-grid">
            <Field label="Machine cat. no." value={test.machine.catalogNo} />
            <Field label="Machine serial"   value={test.machine.serialNo} />
            <Field label="Make"             value={test.machine.make} />
            <Field label="Type"             value={test.machine.type} />
            <Field label="Year of mfg"      value={test.machine.year} />
            <Field label="Software"         value={`${test.machine.software || ''} ${test.machine.softwareVersion || ''}`.trim()} />
            <Field label="Transducer"       value={`${test.transducer.catalogNo || ''} ${test.transducer.serialNo ? '/ ' + test.transducer.serialNo : ''}`.trim()} />
            <Field label="Capacity"         value={`${test.transducer.capacity || ''} ${test.transducer.capacityUnit || ''}`.trim()} />
            <Field label="Mode"             value={test.standard.mode} />
            <Field label="Reversibility"    value={test.standard.reversibility ? 'Yes' : 'No'} />
            <Field label="Condition"        value={`Visual ${test.condition.visual} · Structural ${test.condition.structural} · Drive ${test.condition.drive}`} />
          </div>
        </section>

        <section className="cert-section">
          <h3>Reference standards</h3>
          <div className="cert-grid">
            <Field label="Std device"     value={`${test.tempStandard.name || ''}${test.tempStandard.serialNo ? ' (' + test.tempStandard.serialNo + ')' : ''}`} />
            <Field label="Operator"       value={test.notes.serviceOrderNo /* repurpose if needed */} />
          </div>
        </section>

        {ranges.filter(r => r.results.length > 0).map((range, ri) => {
          const unit = unitLabel(range.unit) || ''
          const hasSecondary = canConvert(range.unit, range.secondaryUnit)
          const secLabel = unitLabel(range.secondaryUnit)
          const runCount = test.standard.runs

          return (
            <section className="cert-section" key={range.id}>
              <h3>Range {ri + 1} — {unit ? `0–${range.end} ${unit}` : `${range.start} → ${range.end}`}</h3>
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Applied{unit && <small> ({unit})</small>}</th>
                    {Array.from({ length: runCount }).map((_, ri2) => (
                      <th key={ri2}>Run {ri2 + 1}</th>
                    ))}
                    <th>Mean</th>
                    <th>Error %</th>
                    <th>Repeat %</th>
                    <th>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {range.results.map((s, i) => {
                    const runs = s.runs || [s.indicated || '', '', '']
                    const mean = meanIndicated(runs)
                    const errPct = (mean != null && s.value !== 0) ? ((mean - s.value) / s.value) * 100 : null
                    const repPct = repeatError(runs)
                    const cls = classifyError(errPct, tol.errMax)
                    return (
                      <tr key={i} className={`cert-row cert-row--${cls}`}>
                        <td>{s.number}</td>
                        <td className="num">{s.value.toFixed(3)}</td>
                        {Array.from({ length: runCount }).map((_, ri2) => (
                          <td key={ri2} className="num">{fmt(runs[ri2])}</td>
                        ))}
                        <td className="num">{mean != null ? mean.toFixed(3) : '—'}</td>
                        <td className="num">{errPct != null ? errPct.toFixed(3) : '—'}</td>
                        <td className="num">{repPct != null ? repPct.toFixed(3) : '—'}</td>
                        <td className={`cert-cls cert-cls--${cls}`}>
                          {cls === 'ok' ? '✓' : cls === 'warn' ? '!' : cls === 'bad' ? '✗' : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {hasSecondary && (
                <p className="cert-note">
                  Secondary unit: {secLabel}. Local g = {Number(range.gravity).toFixed(4)} m/s².
                </p>
              )}
            </section>
          )
        })}

        <section className="cert-section">
          <h3>Result</h3>
          <p className={`cert-overall cert-overall--${overall.status}`}>
            {overall.status === 'pass'
              ? `PASS — all points within ±${tol.errMax}% (Class ${test.standard.accuracyClass}).`
              : overall.status === 'fail'
                ? `FAIL — ${overall.failures} point(s) exceeded ±${tol.errMax}%.`
                : 'Incomplete — Indicated values not yet entered for all points.'}
          </p>
          {test.notes.freeText && (
            <p className="cert-notes-text">{test.notes.freeText}</p>
          )}
        </section>

        <footer className="cert-footer">
          <div>
            <div>Calibrated by</div>
            <div className="sig-line"></div>
            <small>Signature</small>
          </div>
          <div>
            <div>Approved by</div>
            <div className="sig-line"></div>
            <small>Signature</small>
          </div>
          <div className="cert-meta-right">
            <div>Accreditation: {test.notes.accreditationBody}</div>
            <div>Cert. no.: {test.notes.certNo || '—'}</div>
            <div>Issued: {test.notes.startDate || today}</div>
            {test.notes.dueDate && <div>Next due: {test.notes.dueDate}</div>}
          </div>
        </footer>
      </article>
    </section>
  )
}

function Field({ label, value }) {
  return (
    <div className="cert-field">
      <span className="cert-field-label">{label}</span>
      <span className="cert-field-value">{value || '—'}</span>
    </div>
  )
}

function fmt(v) {
  if (v == null || v === '') return '—'
  const n = parseFloat(v)
  return Number.isFinite(n) ? n.toFixed(3) : '—'
}

function computeOverall(test, ranges, tol) {
  let any = false, fail = 0
  for (const r of ranges) {
    for (const s of r.results) {
      const runs = s.runs || [s.indicated || '', '', '']
      const mean = meanIndicated(runs)
      if (mean == null) continue
      any = true
      if (s.value === 0) continue
      const err = ((mean - s.value) / s.value) * 100
      if (Math.abs(err) > tol.errMax) fail++
    }
  }
  if (!any) return { status: 'incomplete', failures: 0 }
  return { status: fail > 0 ? 'fail' : 'pass', failures: fail }
}
