import { useState, useCallback, useRef } from 'react'
import './styles.css'
import {
  SunIcon, MoonIcon, ExpandIcon, CompressIcon,
  CalcIcon, ExportIcon, TrashIcon, ErrorIcon,
  RulerIcon, FlagIcon, HashIcon, FinalFlagIcon,
  PlusIcon, CloseIcon, ChevronIcon
} from './components/Icons'
import { useSystemTheme } from './hooks/useSystemTheme'
import logoImg from '/logo.png'

let nextRangeId = 1

function createRange() {
  return { id: nextRangeId++, start: '', end: '', steps: '', results: [], error: '' }
}

function App() {
  const [ranges, setRanges] = useState([createRange()])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [calcSuccess, setCalcSuccess] = useState(null)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
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
      const numSteps = parseInt(range.steps)

      if (isNaN(startValue) || isNaN(endValue) || isNaN(numSteps)) {
        return { ...range, error: 'Please fill in all fields with valid numbers.', results: [] }
      }
      if (startValue === endValue) {
        return { ...range, error: 'Start and end values must be different.', results: [] }
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
      const endValue = parseFloat(range.end)
      r[index].value = v

      if (index < r.length - 1) {
        const remaining = r.length - index - 1
        const s = (endValue - v) / remaining
        for (let i = index + 1; i < r.length; i++) {
          r[i].value = v + (i - index) * s
          r[i].stepSize = s
        }
      }
      if (index > 0) r[index - 1].stepSize = v - r[index - 1].value
      if (index < r.length - 1) r[index].stepSize = r[index + 1].value - v

      return { ...range, results: r }
    }))
  }

  const exportToCSV = () => {
    const rangesWithResults = ranges.filter(r => r.results.length > 0)
    if (!rangesWithResults.length) return

    const rows = ['Range,Step,Value,Step Size']
    rangesWithResults.forEach((range, ri) => {
      const label = rangesWithResults.length > 1 ? `R${ri + 1}` : ''
      range.results.forEach(s => {
        rows.push(`${label},${s.number},${s.value.toFixed(3)},${s.stepSize.toFixed(3)}`)
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const hasAnyResults = ranges.some(r => r.results.length > 0)
  const multiRange = ranges.length > 1

  const howTo = [
    'Enter a start value for your range',
    'Enter your target end value',
    'Choose the number of steps (min. 2)',
    'Add more ranges if needed',
    'Tap Calculate to see results'
  ]

  // Detect completed steps based on current state
  const r0 = ranges[0] || {}
  const stepsDone = [
    r0.start !== '',
    r0.end !== '',
    r0.steps !== '',
    ranges.length > 1,
    hasAnyResults
  ]
  // Current step = first incomplete (skip step 4 "add ranges" — it's optional)
  const currentStep = stepsDone.findIndex((done, i) => !done && i !== 3)
  const allDone = hasAnyResults

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

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="header-logo-btn" onClick={() => setShowLogoModal(true)}
            aria-label="View logo">
            <img src={logoImg} alt="Johansson Engineering" className="header-logo" />
          </button>
          <div className="header-text">
            <div className="header-title">StepWise</div>
            <div className="header-subtitle">Johansson Engineering</div>
          </div>
        </div>
        <div className="header-buttons">
          <button className="header-btn" onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
          </button>
          <button className="header-btn" onClick={toggleTheme}
            aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}>
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <div className="app-content">
        {/* How to Use — collapsible */}
        <section className="section">
          <button className="section-toggle section-toggle--red" onClick={() => setShowHowTo(v => !v)}
            aria-expanded={showHowTo} aria-label="Toggle how to use section">
            <ChevronIcon expanded={showHowTo} />
            <span className="section-header">How to Use</span>
          </button>
          {showHowTo && (
            <div className="card card--howto">
              {howTo.map((text, i) => {
                const done = stepsDone[i]
                const active = i === currentStep
                const cls = done ? 'step-row step-row--done'
                  : active ? 'step-row step-row--active'
                  : 'step-row step-row--future'
                return (
                  <div key={i} className={cls}>
                    <span className="step-num">
                      {done ? '✓' : i + 1}
                    </span>
                    <span className="step-text">{text}</span>
                  </div>
                )
              })}
              {allDone && (
                <div className="step-row step-row--complete">
                  <span className="step-text">All done! Scroll down to see your results.</span>
                </div>
              )}
            </div>
          )}
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
              <div className={`card-row${focusedInput === `start-${range.id}` ? ' card-row--focused' : ''}`}>
                <label className="card-row-label" htmlFor={`start-${range.id}`}>
                  <RulerIcon /> Start
                </label>
                <input className="input" type="number" inputMode="decimal" id={`start-${range.id}`}
                  step="any" placeholder="0" value={range.start}
                  onChange={e => updateRange(range.id, { start: e.target.value })}
                  onFocus={() => setFocusedInput(`start-${range.id}`)}
                  onBlur={() => setFocusedInput(null)} />
              </div>
              <div className={`card-row${focusedInput === `end-${range.id}` ? ' card-row--focused' : ''}`}>
                <label className="card-row-label" htmlFor={`end-${range.id}`}>
                  <FlagIcon /> End
                </label>
                <input className="input" type="number" inputMode="decimal" id={`end-${range.id}`}
                  step="any" placeholder="100" value={range.end}
                  onChange={e => updateRange(range.id, { end: e.target.value })}
                  onFocus={() => setFocusedInput(`end-${range.id}`)}
                  onBlur={() => setFocusedInput(null)} />
              </div>
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
            </div>
            {range.error && (
              <div className="error" role="alert">
                <ErrorIcon /> {range.error}
              </div>
            )}
          </section>
        ))}

        {/* Add Range + Calculate row */}
        <section className="section">
          <div className="action-stack">
            <button className="btn btn--outline btn--add-range" onClick={addRange}>
              <PlusIcon /> Add Range
            </button>
            <button className={`btn${calcSuccess ? ' btn--success' : ''}`}
              onClick={calculateAll}>
              <CalcIcon /> Calculate{multiRange ? ' All' : ''}
            </button>
          </div>
        </section>

        {/* Actions */}
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
                      {summary.from.toFixed(1)} → {summary.to.toFixed(1)}
                    </div>
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Step Size</div>
                    <div className="results-summary-value">{summary.avg.toFixed(3)}</div>
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

                  return (
                    <div key={step.number} className="result-row" style={{ '--i': i }}>
                      <div className="result-progress"
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      <span className="result-step">{step.number}</span>
                      <div className="result-value">
                        <input type="number" className="result-value-input"
                          value={step.value.toFixed(3)}
                          onChange={ev => handleStepEdit(range.id, i, ev.target.value)}
                          step="any" />
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

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Johansson Engineering</p>
        </footer>

        {/* About — collapsible, below footer */}
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
                    Create multiple ranges with different, overlapping, or identical
                    parameters. Edit any calculated value and subsequent steps
                    recalculate automatically. Export results as CSV for use in
                    spreadsheets and control systems.
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
      </div>
    </div>
  )
}

export default App
