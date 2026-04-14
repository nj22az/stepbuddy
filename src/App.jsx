import { useState, useRef } from 'react'
import './styles.css'
import {
  SunIcon, MoonIcon,
  CalcIcon, ExportIcon, TrashIcon, ErrorIcon,
  RulerIcon, FlagIcon, HashIcon, FinalFlagIcon,
  PlusIcon, CloseIcon, ChevronIcon
} from './components/Icons'
import { useSystemTheme } from './hooks/useSystemTheme'
import {
  UNIT_GROUPS, GROUP_ORDER, GRAVITY_PRESETS, STANDARD_GRAVITY,
  convert, canConvert, needsGravity, unitLabel, secondaryOptionsFor,
} from './units'
import logoImg from '/logo.png'

let nextRangeId = 1

// Percentage presets for calibration workflows.
// ISO 7500-1 (uniaxial testing machines), ISO 9513 (extensometers),
// ISO 376 (force-proving instruments) — each calls for verification at
// defined percentage points of the working range rather than even spacing.
const PERCENT_PRESETS = {
  'iso-7500-low':  { label: 'ISO 7500 — low range',        values: [0, 2, 5, 10, 20, 40, 60, 80, 100] },
  'iso-7500':      { label: 'ISO 7500-1 (5-point)',        values: [20, 40, 60, 80, 100] },
  'iso-7500-zero': { label: 'ISO 7500-1 + 0% preload',     values: [0, 20, 40, 60, 80, 100] },
  'iso-9513':      { label: 'ISO 9513 (5-point)',          values: [20, 40, 60, 80, 100] },
  'iso-376':       { label: 'ISO 376 (10-point)',          values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
  'custom':        { label: 'Custom',                       values: null },
}

const DEFAULT_PRESET = 'iso-7500-low'
const presetToList = (key) => (PERCENT_PRESETS[key]?.values ?? []).join(', ')

function createRange() {
  return {
    id: nextRangeId++,
    start: '',
    end: '',
    steps: '',
    mode: 'absolute',
    preset: DEFAULT_PRESET,
    percentList: presetToList(DEFAULT_PRESET),
    unit: '',
    secondaryUnit: '',
    gravity: STANDARD_GRAVITY,
    gravityPreset: 'standard',
    optionsOpen: false,
    results: [],
    error: '',
  }
}

// Human-readable summary of the current unit/gravity config, shown on the
// disclosure row so the user doesn't have to expand to see what's set.
function unitsSummary(range) {
  const primary = unitLabel(range.unit)
  const secondary = unitLabel(range.secondaryUnit)
  if (!primary) return 'None'
  if (!secondary) return primary
  if (needsGravity(range.unit, range.secondaryUnit)) {
    return `${primary} → ${secondary} · g=${Number(range.gravity).toFixed(4)}`
  }
  return `${primary} → ${secondary}`
}

function App() {
  const [ranges, setRanges] = useState([createRange()])
  const [focusedInput, setFocusedInput] = useState(null)
  const [calcSuccess, setCalcSuccess] = useState(null)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  const [isDarkMode, toggleTheme] = useSystemTheme()
  const resultsRef = useRef(null)

  const updateRange = (id, updates) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const addRange = () => {
    setRanges(prev => [...prev, createRange()])
  }

  const removeRange = (id) => {
    setRanges(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
  }

  const calculateAll = () => {
    setRanges(prev => prev.map(range => {
      const startValue = parseFloat(range.start)
      const endValue = parseFloat(range.end)

      if (isNaN(startValue) || isNaN(endValue)) {
        return { ...range, error: 'Please fill in all fields with valid numbers.', results: [] }
      }
      if (startValue === endValue) {
        return { ...range, error: 'Start and end values must be different.', results: [] }
      }

      if (range.mode === 'percentage') {
        const parsed = (range.percentList || '')
          .split(/[,\s]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(Number)
        if (parsed.some(n => !Number.isFinite(n))) {
          return { ...range, error: 'Percentage list must contain numbers only (e.g. 0, 20, 40, 60, 80, 100).', results: [] }
        }
        const uniqueSorted = Array.from(new Set(parsed)).sort((a, b) => a - b)
        if (uniqueSorted.length < 2) {
          return { ...range, error: 'Provide at least two distinct percentage points.', results: [] }
        }

        const span = endValue - startValue
        // Preserve the user's written order so a descending Start→End range
        // produces a descending sequence (100 → 0), matching absolute-mode feel.
        const descending = span < 0
        const ordered = descending ? uniqueSorted.slice().reverse() : uniqueSorted

        const results = ordered.map((p, i) => {
          const value = startValue + (p / 100) * span
          const prev = i === 0 ? startValue : startValue + (ordered[i - 1] / 100) * span
          return {
            number: startValue === 0 ? i : i + 1,
            value,
            stepSize: i === 0 ? 0 : value - prev,
            percent: p,
          }
        })

        return { ...range, results, error: '' }
      }

      const numSteps = parseInt(range.steps)
      if (isNaN(numSteps)) {
        return { ...range, error: 'Please fill in all fields with valid numbers.', results: [] }
      }
      if (numSteps < 2) {
        return { ...range, error: 'Number of steps must be at least 2.', results: [] }
      }

      const stepSize = (endValue - startValue) / (numSteps - 1)
      const results = Array.from({ length: numSteps }, (_, i) => ({
        number: startValue === 0 ? i : i + 1,
        value: startValue + i * stepSize,
        stepSize
      }))

      return { ...range, results, error: '' }
    }))

    setCalcSuccess(true)
    setTimeout(() => setCalcSuccess(false), 400)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleStepEdit = (rangeId, index, newValue) => {
    const v = parseFloat(newValue)
    if (isNaN(v)) return

    setRanges(prev => prev.map(range => {
      if (range.id !== rangeId) return range
      const r = [...range.results]
      r[index] = { ...r[index], value: v }

      if (range.mode === 'percentage') {
        // ISO percentage points are fixed by the standard; only recompute
        // the deltas adjacent to the edited row — don't redistribute the rest.
        if (index > 0) {
          r[index] = { ...r[index], stepSize: v - r[index - 1].value }
        }
        if (index < r.length - 1) {
          r[index + 1] = { ...r[index + 1], stepSize: r[index + 1].value - v }
        }
        return { ...range, results: r }
      }

      const endValue = parseFloat(range.end)
      if (index < r.length - 1) {
        const remaining = r.length - index - 1
        const s = (endValue - v) / remaining
        for (let i = index + 1; i < r.length; i++) {
          r[i] = { ...r[i], value: v + (i - index) * s, stepSize: s }
        }
      }
      if (index > 0) r[index - 1] = { ...r[index - 1], stepSize: v - r[index - 1].value }
      if (index < r.length - 1) r[index] = { ...r[index], stepSize: r[index + 1].value - v }

      return { ...range, results: r }
    }))
  }

  const exportToCSV = () => {
    const rangesWithResults = ranges.filter(r => r.results.length > 0)
    if (!rangesWithResults.length) return

    const anySecondary = rangesWithResults.some(r => canConvert(r.unit, r.secondaryUnit))
    const header = anySecondary
      ? 'Range,Step,Value,Unit,Step Size,Secondary,Secondary Unit'
      : 'Range,Step,Value,Unit,Step Size'
    const rows = [header]

    rangesWithResults.forEach((range, ri) => {
      const label = rangesWithResults.length > 1 ? `R${ri + 1}` : ''
      const unit = unitLabel(range.unit)
      const secondaryUnit = unitLabel(range.secondaryUnit)
      const hasSecondary = canConvert(range.unit, range.secondaryUnit)
      range.results.forEach(s => {
        const base = `${label},${s.number},${s.value.toFixed(3)},${unit},${s.stepSize.toFixed(3)}`
        if (!anySecondary) {
          rows.push(base)
        } else if (hasSecondary) {
          const sv = convert(s.value, range.unit, range.secondaryUnit, range.gravity)
          rows.push(`${base},${sv.toFixed(3)},${secondaryUnit}`)
        } else {
          rows.push(`${base},,`)
        }
      })
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }))
    link.download = 'step_sequence.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAll = () => {
    setRanges([createRange()])
  }

  const hasAnyResults = ranges.some(r => r.results.length > 0)
  const multiRange = ranges.length > 1

  return (
    <div className="app">
      {/* Logo zoom modal */}
      {showLogoModal && (
        <div className="logo-modal" onClick={() => setShowLogoModal(false)}>
          <div className="logo-modal-content">
            <img src={logoImg} alt="Johansson Engineering" />
            <div className="logo-modal-title">Johansson Engineering</div>
            <div className="logo-modal-subtitle">Est. 1983</div>
          </div>
        </div>
      )}

      {/* Header — two bento cards */}
      <header className="header">
        <button className="header-logo-btn" onClick={() => setShowLogoModal(true)}
          aria-label="View logo">
          <img src={logoImg} alt="Johansson Engineering" className="header-logo" />
        </button>
        <div className="header-text">
          <div className="header-title">StepWise</div>
          <div className="header-subtitle">Johansson Engineering</div>
          <div className="header-buttons">
            <button className="header-btn" onClick={toggleTheme}
              aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}>
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className="app-content">
        {/* App title bento */}
        <section className="section">
          <div className="card title-card">
            <div className="title-card-text">Step Sequence Calculator</div>
          </div>
        </section>

        {/* Range Inputs */}
        {ranges.map((range, ri) => (
          <section className="section" key={range.id}>
            <div className="section-header-row">
              <h2 className="section-header">
                {multiRange ? `Range ${ri + 1}` : 'Values'}
              </h2>
              {multiRange && (
                <button className="range-remove-btn" onClick={() => removeRange(range.id)}
                  aria-label={`Remove range ${ri + 1}`}>
                  <CloseIcon />
                </button>
              )}
            </div>
            <div className="card">
              <div className="card-row mode-toggle" role="tablist" aria-label="Step input mode">
                <button type="button" role="tab"
                  aria-selected={range.mode === 'absolute'}
                  className={`mode-btn${range.mode === 'absolute' ? ' mode-btn--active' : ''}`}
                  onClick={() => updateRange(range.id, { mode: 'absolute' })}>
                  Absolute
                </button>
                <button type="button" role="tab"
                  aria-selected={range.mode === 'percentage'}
                  className={`mode-btn${range.mode === 'percentage' ? ' mode-btn--active' : ''}`}
                  onClick={() => updateRange(range.id, { mode: 'percentage' })}>
                  Percentage
                </button>
              </div>
              <button type="button" className="card-row options-toggle"
                onClick={() => updateRange(range.id, { optionsOpen: !range.optionsOpen })}
                aria-expanded={range.optionsOpen}>
                <span className="card-row-label">
                  <ChevronIcon expanded={range.optionsOpen} /> Units &amp; gravity
                </span>
                <span className="options-summary">{unitsSummary(range)}</span>
              </button>
              {range.optionsOpen && (
                <>
                  <div className={`card-row${focusedInput === `unit-${range.id}` ? ' card-row--focused' : ''}`}>
                    <label className="card-row-label" htmlFor={`unit-${range.id}`}>
                      Unit
                    </label>
                    <div className="unit-picker">
                      <select className="input input--select unit-select" id={`unit-${range.id}`}
                        value={range.unit}
                        onChange={e => {
                          const next = e.target.value
                          const updates = { unit: next }
                          // Drop an incompatible secondary when the primary changes.
                          if (next === '' || (range.secondaryUnit && !canConvert(next, range.secondaryUnit))) {
                            updates.secondaryUnit = ''
                          }
                          updateRange(range.id, updates)
                        }}
                        onFocus={() => setFocusedInput(`unit-${range.id}`)}
                        onBlur={() => setFocusedInput(null)}>
                        {GROUP_ORDER.map(gid => (
                          <optgroup key={gid} label={UNIT_GROUPS[gid].label}>
                            {Object.entries(UNIT_GROUPS[gid].units).map(([id, u]) => (
                              <option key={id || 'none'} value={id}>{u.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <span className="unit-arrow" aria-hidden="true">→</span>
                      <select className="input input--select unit-select" aria-label="Secondary unit"
                        value={range.secondaryUnit}
                        disabled={!range.unit}
                        onChange={e => updateRange(range.id, { secondaryUnit: e.target.value })}>
                        <option value="">— none —</option>
                        {secondaryOptionsFor(range.unit).map(group => (
                          <optgroup key={group.groupId} label={group.groupLabel}>
                            {group.units.map(u => (
                              <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                  {needsGravity(range.unit, range.secondaryUnit) && (
                    <div className={`card-row${focusedInput === `gravity-${range.id}` ? ' card-row--focused' : ''}`}>
                      <label className="card-row-label" htmlFor={`gravity-${range.id}`}>
                        Gravity g
                      </label>
                      <div className="gravity-picker">
                        <input className="input gravity-input" type="number" inputMode="decimal"
                          id={`gravity-${range.id}`} step="any" min="0"
                          value={range.gravity}
                          onChange={e => updateRange(range.id, {
                            gravity: parseFloat(e.target.value) || 0,
                            gravityPreset: 'custom',
                          })}
                          onFocus={() => setFocusedInput(`gravity-${range.id}`)}
                          onBlur={() => setFocusedInput(null)} />
                        <select className="input input--select gravity-preset"
                          aria-label="Gravity preset"
                          value={range.gravityPreset}
                          onChange={e => {
                            const key = e.target.value
                            const preset = GRAVITY_PRESETS[key]
                            updateRange(range.id, {
                              gravityPreset: key,
                              ...(preset && preset.value != null ? { gravity: preset.value } : {}),
                            })
                          }}>
                          {Object.entries(GRAVITY_PRESETS).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className={`card-row${focusedInput === `start-${range.id}` ? ' card-row--focused' : ''}`}>
                <label className="card-row-label" htmlFor={`start-${range.id}`}>
                  <RulerIcon /> Start
                </label>
                <input className="input" type="number" inputMode="decimal" id={`start-${range.id}`}
                  step="any" placeholder={unitLabel(range.unit) ? `0 ${unitLabel(range.unit)}` : '0'}
                  value={range.start}
                  onChange={e => updateRange(range.id, { start: e.target.value })}
                  onFocus={() => setFocusedInput(`start-${range.id}`)}
                  onBlur={() => setFocusedInput(null)} />
              </div>
              <div className={`card-row${focusedInput === `end-${range.id}` ? ' card-row--focused' : ''}`}>
                <label className="card-row-label" htmlFor={`end-${range.id}`}>
                  <FlagIcon /> End
                </label>
                <input className="input" type="number" inputMode="decimal" id={`end-${range.id}`}
                  step="any" placeholder={unitLabel(range.unit) ? `100 ${unitLabel(range.unit)}` : '100'}
                  value={range.end}
                  onChange={e => updateRange(range.id, { end: e.target.value })}
                  onFocus={() => setFocusedInput(`end-${range.id}`)}
                  onBlur={() => setFocusedInput(null)} />
              </div>
              {range.mode === 'absolute' ? (
                <div className={`card-row${focusedInput === `steps-${range.id}` ? ' card-row--focused' : ''}`}>
                  <label className="card-row-label" htmlFor={`steps-${range.id}`}>
                    <HashIcon /> Steps
                  </label>
                  <input className="input" type="number" inputMode="numeric" id={`steps-${range.id}`}
                    min="2" placeholder="Min. 2" value={range.steps}
                    onChange={e => updateRange(range.id, { steps: e.target.value })}
                    onFocus={() => setFocusedInput(`steps-${range.id}`)}
                    onBlur={() => setFocusedInput(null)} />
                </div>
              ) : (
                <>
                  <div className={`card-row${focusedInput === `preset-${range.id}` ? ' card-row--focused' : ''}`}>
                    <label className="card-row-label" htmlFor={`preset-${range.id}`}>
                      <RulerIcon /> Preset
                    </label>
                    <select className="input input--select" id={`preset-${range.id}`}
                      value={range.preset}
                      onChange={e => {
                        const key = e.target.value
                        updateRange(range.id, {
                          preset: key,
                          ...(key !== 'custom' ? { percentList: presetToList(key) } : {}),
                        })
                      }}
                      onFocus={() => setFocusedInput(`preset-${range.id}`)}
                      onBlur={() => setFocusedInput(null)}>
                      {Object.entries(PERCENT_PRESETS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`card-row${focusedInput === `percent-${range.id}` ? ' card-row--focused' : ''}`}>
                    <label className="card-row-label" htmlFor={`percent-${range.id}`}>
                      <HashIcon /> Points %
                    </label>
                    <input className="input" type="text" inputMode="decimal" id={`percent-${range.id}`}
                      placeholder="0, 2, 5, 10, 20, 40, 60, 80, 100"
                      value={range.percentList}
                      onChange={e => updateRange(range.id, { percentList: e.target.value, preset: 'custom' })}
                      onFocus={() => setFocusedInput(`percent-${range.id}`)}
                      onBlur={() => setFocusedInput(null)} />
                  </div>
                </>
              )}
            </div>
            {ri === 0 && !hasAnyResults && (
              <p className="section-footer">
                {range.mode === 'absolute'
                  ? 'Enter start, end, and number of steps to generate a sequence.'
                  : 'Enter full-scale start and end, then choose a calibration preset (ISO 7500 / 9513 / 376) or edit the percentage list.'}
              </p>
            )}
            {range.error && (
              <div className="error" role="alert">
                <ErrorIcon /> {range.error}
              </div>
            )}
          </section>
        ))}

        {/* Add Range + Calculate — inline row */}
        <section className="section">
          <div className="action-row">
            <button className="action-pill" onClick={addRange}>
              <PlusIcon /> Add Range
            </button>
            <button className={`action-pill action-pill--primary${calcSuccess ? ' btn--success' : ''}`}
              onClick={calculateAll}>
              <CalcIcon /> Calculate
            </button>
          </div>
        </section>

        {/* Export / Clear */}
        {hasAnyResults && (
          <section className="section">
            <div className="btn-row">
              <button className="btn btn--green" onClick={exportToCSV}>
                <ExportIcon /> Export
              </button>
              <button className="btn btn--outline" onClick={clearAll}>
                <TrashIcon /> Clear
              </button>
            </div>
          </section>
        )}

        {/* Results */}
        {ranges.map((range, ri) => {
          if (range.results.length === 0) return null

          const first = range.results[0].value
          const last = range.results[range.results.length - 1].value
          const summary = {
            from: first,
            to: last,
            avg: Math.abs((last - first) / (range.results.length - 1)),
            count: range.results.length
          }

          const primaryLabel = unitLabel(range.unit)
          const secondaryLabel = unitLabel(range.secondaryUnit)
          const hasSecondary = canConvert(range.unit, range.secondaryUnit)
          const secondaryOf = (v) => hasSecondary
            ? convert(v, range.unit, range.secondaryUnit, range.gravity)
            : null

          return (
            <section className="section" key={`results-${range.id}`}
              ref={ri === 0 ? resultsRef : null}>
              <h2 className="section-header">
                {multiRange
                  ? `Range ${ri + 1} — ${range.results.length} steps`
                  : `Results — ${range.results.length} steps`}
              </h2>
              <div className="card">
                <div className="results-summary">
                  <div className="results-summary-item">
                    <div className="results-summary-label">From → To</div>
                    <div className="results-summary-value">
                      {summary.from.toFixed(1)} → {summary.to.toFixed(1)}{primaryLabel ? ` ${primaryLabel}` : ''}
                    </div>
                    {hasSecondary && (
                      <div className="results-summary-secondary">
                        {secondaryOf(summary.from).toFixed(1)} → {secondaryOf(summary.to).toFixed(1)} {secondaryLabel}
                      </div>
                    )}
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Step Size</div>
                    <div className="results-summary-value">
                      {summary.avg.toFixed(3)}{primaryLabel ? ` ${primaryLabel}` : ''}
                    </div>
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Steps</div>
                    <div className="results-summary-value">{summary.count}</div>
                  </div>
                </div>

                <div className="results-header">
                  <span className="results-header-cell">#</span>
                  <span className="results-header-cell">Value</span>
                  <span className="results-header-cell">Delta</span>
                </div>

                {range.results.map((step, i) => {
                  const isLast = i === range.results.length - 1
                  const positive = step.stepSize >= 0
                  const s = range.results[0].value
                  const e = range.results[range.results.length - 1].value
                  const rangeSpan = e - s
                  const pct = rangeSpan !== 0 ? ((step.value - s) / rangeSpan) * 100 : 0
                  const secondaryValue = secondaryOf(step.value)

                  return (
                    <div key={step.number} className="result-row" style={{ '--i': i }}>
                      <div className="result-progress"
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      <span className="result-step">{step.number}</span>
                      <div className="result-value">
                        <div className="result-value-primary">
                          <input type="number" className="result-value-input"
                            value={step.value.toFixed(3)}
                            onChange={ev => handleStepEdit(range.id, i, ev.target.value)}
                            step="any" />
                          {primaryLabel && (
                            <span className="result-value-unit">{primaryLabel}</span>
                          )}
                        </div>
                        {secondaryValue != null && (
                          <div className="result-value-secondary">
                            {secondaryValue.toFixed(3)} {secondaryLabel}
                          </div>
                        )}
                      </div>
                      {isLast ? (
                        <span className="result-delta result-delta--neutral">
                          <span className="result-final">
                            <FinalFlagIcon /> End
                          </span>
                        </span>
                      ) : (
                        <span className={`result-delta ${positive ? 'result-delta--positive' : 'result-delta--negative'}`}>
                          {positive ? '+' : ''}{step.stepSize.toFixed(3)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="section-footer">Tap any value to edit. Subsequent steps recalculate.</p>
            </section>
          )
        })}

        {/* About — collapsible */}
        <section className="section">
          <button className="section-toggle" onClick={() => setShowAbout(v => !v)}
            aria-expanded={showAbout} aria-label="Toggle about section">
            <ChevronIcon expanded={showAbout} />
            <span className="section-header">About</span>
          </button>
          {showAbout && (
            <div className="card">
              <div className="about-content">
                <button className="about-logo" onClick={() => setShowLogoModal(true)}>
                  <img src={logoImg} alt="Johansson Engineering stamp" />
                  <div className="about-logo-text">
                    <div className="about-logo-title">Johansson Engineering</div>
                    <div className="about-logo-subtitle">Est. 1983</div>
                  </div>
                </button>
                <div className="about-text">
                  <p>
                    StepWise is a precision step sequence calculator for generating
                    evenly spaced values between defined start and end points. Built
                    for engineers, technicians, and anyone who needs accurate
                    incremental sequences.
                  </p>
                  <p>
                    Create multiple ranges with different parameters. Edit any
                    calculated value and subsequent steps recalculate automatically.
                    Export results as CSV.
                  </p>
                  <p>
                    Switch a range to Percentage mode to generate calibration
                    sequences from ISO 7500-1, ISO 9513, or ISO 376 preset points,
                    or enter a custom percentage list.
                  </p>
                </div>
                <div className="about-separator" />
                <div className="about-meta">
                  <span className="about-meta-item">JDS-SFW-001</span>
                  <span className="about-meta-item">Rev A</span>
                  <span className="about-meta-item">Nils Johansson</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Johansson Engineering</p>
        </footer>
      </div>
    </div>
  )
}

export default App
