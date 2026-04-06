import { useState, useCallback, useRef } from 'react'
import './styles.css'
import {
  SunIcon, MoonIcon, ExpandIcon, CompressIcon,
  CalcIcon, ExportIcon, TrashIcon, ErrorIcon,
  RulerIcon, FlagIcon, HashIcon, FinalFlagIcon
} from './components/Icons'
import { useScrollState } from './hooks/useScrollState'
import { useSystemTheme } from './hooks/useSystemTheme'

function App() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [steps, setSteps] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [calcSuccess, setCalcSuccess] = useState(false)

  const [isDarkMode, toggleTheme] = useSystemTheme()
  const isScrolled = useScrollState(10)
  const resultsRef = useRef(null)

  const calculateSteps = () => {
    setError('')
    setResults([])

    const startValue = parseFloat(start)
    const endValue = parseFloat(end)
    const numSteps = parseInt(steps)

    if (isNaN(startValue) || isNaN(endValue) || isNaN(numSteps)) {
      setError('Please fill in all fields with valid numbers.')
      return
    }

    if (startValue === endValue) {
      setError('Start and end values must be different.')
      return
    }

    if (numSteps < 2) {
      setError('Number of steps must be at least 2.')
      return
    }

    const stepSize = (endValue - startValue) / (numSteps - 1)

    const newResults = Array.from({ length: numSteps }, (_, i) => ({
      number: startValue === 0 ? i : i + 1,
      value: startValue + (i * stepSize),
      stepSize: stepSize
    }))

    setResults(newResults)

    // #46 — Success flash
    setCalcSuccess(true)
    setTimeout(() => setCalcSuccess(false), 600)

    // #75 — Auto-scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleStepEdit = (index, newValue) => {
    const newValueNum = parseFloat(newValue)
    if (isNaN(newValueNum)) return

    const newResults = [...results]
    newResults[index].value = newValueNum

    if (index < results.length - 1) {
      const remainingSteps = results.length - index - 1
      const stepSize = (parseFloat(end) - newValueNum) / remainingSteps
      for (let i = index + 1; i < results.length; i++) {
        newResults[i].value = newValueNum + (i - index) * stepSize
        newResults[i].stepSize = stepSize
      }
    }

    if (index > 0) {
      newResults[index - 1].stepSize = newValueNum - newResults[index - 1].value
    }
    if (index < results.length - 1) {
      newResults[index].stepSize = newResults[index + 1].value - newValueNum
    }

    setResults(newResults)
  }

  const exportToCSV = () => {
    if (results.length === 0) return
    const csvContent = [
      'Step,Value,Step Size,Progress',
      ...results.map(step => {
        const stepSize = (parseFloat(end) - parseFloat(start)) / (results.length - 1)
        const progress = ((step.number - (parseFloat(start) === 0 ? 0 : 1)) / (results.length - 1)) * 100
        return `${step.number},${step.value.toFixed(3)},${stepSize.toFixed(3)},${progress.toFixed(1)}%`
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'step_sequence.csv'
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAll = () => {
    setStart('')
    setEnd('')
    setSteps('')
    setError('')
    setResults([])
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

  // #70 — Summary calculations
  const summary = results.length > 0 ? {
    range: Math.abs(results[results.length - 1].value - results[0].value),
    avgStep: Math.abs((parseFloat(end) - parseFloat(start)) / (results.length - 1)),
    count: results.length
  } : null

  const instructions = [
    'Enter your starting value',
    'Enter your target end value',
    'Choose how many steps you need (min. 2)',
    'Get evenly spaced values and progress tracking',
    'Export or visualize your sequence'
  ]

  return (
    <>
      {/* #1,2,4 — Animated gradient orbs */}
      <div className="glass-bg" aria-hidden="true">
        <div className="glass-bg-orb glass-bg-orb--warm" />
        <div className="glass-bg-orb glass-bg-orb--cool" />
        <div className="glass-bg-orb glass-bg-orb--gold" />
        <div className="glass-bg-orb glass-bg-orb--rose" />
      </div>

      {/* #6 — Vignette */}
      <div className="glass-vignette" aria-hidden="true" />
      {/* #7 — Dark mode aurora */}
      <div className="glass-aurora" aria-hidden="true" />
      {/* #10 — Ambient light */}
      <div className="glass-ambient-light" aria-hidden="true" />
      {/* #5 — Noise overlay */}
      <div className="glass-noise-overlay" aria-hidden="true" />

      <div className="ios-app">
        {/* #26-31 — Dynamic navigation bar */}
        <nav className={`nav-bar${isScrolled ? ' nav-bar--scrolled' : ''}`} role="navigation">
          <div className="nav-bar-buttons">
            <button className="nav-bar-button" onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
            </button>
          </div>
          <span className="nav-bar-title">Step Buddy</span>
          <div className="nav-bar-buttons">
            <button className="nav-bar-button" onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </nav>

        {/* #29,33,34 — Large title with gradient */}
        <div className="large-title-area">
          <h1 className="large-title">Step Buddy</h1>
          <p className="large-title-subtitle">Professional step sequence calculator</p>
        </div>

        <div className="ios-scroll-content">
          {/* How to Use */}
          <section className="ios-section" aria-labelledby="howto-header">
            <h2 className="ios-section-header" id="howto-header">How to Use</h2>
            <div className="ios-card">
              {instructions.map((text, i) => (
                <div key={i} className="ios-steps-row">
                  <span className="ios-step-number">{i + 1}</span>
                  <span className="ios-step-text">{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Calculator Inputs — #51,54,55,56,58 */}
          <section className="ios-section" aria-label="Calculator Inputs">
            <h2 className="ios-section-header">Values</h2>
            <div className="ios-card">
              <div className={`ios-row${focusedInput === 'start' ? ' ios-row--focused' : ''}`}>
                <label className="ios-row-label" htmlFor="start">
                  <RulerIcon />
                  Start Value
                </label>
                <input
                  className="ios-input"
                  type="number"
                  inputMode="decimal"
                  id="start"
                  step="any"
                  placeholder="0"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  onFocus={() => setFocusedInput('start')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
              <div className={`ios-row${focusedInput === 'end' ? ' ios-row--focused' : ''}`}>
                <label className="ios-row-label" htmlFor="end">
                  <FlagIcon />
                  End Value
                </label>
                <input
                  className="ios-input"
                  type="number"
                  inputMode="decimal"
                  id="end"
                  step="any"
                  placeholder="100"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  onFocus={() => setFocusedInput('end')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
              <div className={`ios-row${focusedInput === 'steps' ? ' ios-row--focused' : ''}`}>
                <label className="ios-row-label" htmlFor="steps">
                  <HashIcon />
                  Steps
                </label>
                <input
                  className="ios-input"
                  type="number"
                  inputMode="numeric"
                  id="steps"
                  min="2"
                  placeholder="Min. 2"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  onFocus={() => setFocusedInput('steps')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
            </div>
            <p className="ios-section-footer">
              Enter a start value, end value, and number of steps to generate an evenly spaced sequence.
            </p>
          </section>

          {/* #80 — Error banner */}
          {error && (
            <div className="ios-error" role="alert">
              <ErrorIcon />
              {error}
            </div>
          )}

          {/* #36,37,43,46 — Glass calculate button */}
          <section className="ios-section">
            <button
              className={`ios-button-filled${calcSuccess ? ' ios-button-filled--success' : ''}`}
              onClick={calculateSteps}
              aria-label="Calculate Steps"
            >
              <CalcIcon />
              Calculate Steps
            </button>
          </section>

          {/* #41 — Action buttons */}
          {results.length > 0 && (
            <section className="ios-section">
              <div className="ios-button-row">
                <button className="ios-button-filled green" onClick={exportToCSV} aria-label="Export to CSV">
                  <ExportIcon />
                  Export CSV
                </button>
                <button className="ios-button-filled red" onClick={clearAll} aria-label="Clear All">
                  <TrashIcon />
                  Clear
                </button>
              </div>
            </section>
          )}

          {/* #61-75 — Results section */}
          {results.length > 0 && (
            <section className="ios-section" aria-label="Step Results" ref={resultsRef}>
              <h2 className="ios-section-header">
                Step Sequence — {results.length} steps
              </h2>
              <div className="ios-card ios-card--results">
                {/* #70 — Summary strip */}
                {summary && (
                  <div className="ios-results-summary">
                    <div className="ios-results-summary-item">
                      <div className="ios-results-summary-label">Range</div>
                      <div className="ios-results-summary-value">{summary.range.toFixed(2)}</div>
                    </div>
                    <div className="ios-results-summary-item">
                      <div className="ios-results-summary-label">Avg Step</div>
                      <div className="ios-results-summary-value">{summary.avgStep.toFixed(3)}</div>
                    </div>
                    <div className="ios-results-summary-item">
                      <div className="ios-results-summary-label">Steps</div>
                      <div className="ios-results-summary-value">{summary.count}</div>
                    </div>
                  </div>
                )}

                <div className="ios-results-header">
                  <span className="ios-results-header-cell">Step</span>
                  <span className="ios-results-header-cell">Value</span>
                  <span className="ios-results-header-cell">Delta</span>
                </div>

                {results.map((step, index) => {
                  const isLast = index === results.length - 1
                  const isPositive = step.stepSize >= 0
                  // #63 — Progress calculation
                  const startVal = results[0].value
                  const endVal = results[results.length - 1].value
                  const totalRange = endVal - startVal
                  const progress = totalRange !== 0
                    ? ((step.value - startVal) / totalRange) * 100
                    : 0

                  return (
                    <div
                      key={step.number}
                      className="ios-result-row"
                      style={{ '--row-index': index }}
                    >
                      {/* #63 — Progress bar */}
                      <div
                        className="ios-result-progress"
                        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                      />

                      {/* #65 — Pill badge step number */}
                      <span className="ios-result-step">{step.number}</span>

                      <div className="ios-result-value">
                        <input
                          type="number"
                          className="ios-result-value-input"
                          value={step.value.toFixed(3)}
                          onChange={(e) => handleStepEdit(index, e.target.value)}
                          step="any"
                        />
                      </div>

                      {/* #66,74 — Color-coded delta + final badge */}
                      {isLast ? (
                        <span className="ios-result-delta ios-result-delta--neutral">
                          <span className="ios-result-final-badge">
                            <FinalFlagIcon /> Final
                          </span>
                        </span>
                      ) : (
                        <span className={`ios-result-delta ${isPositive ? 'ios-result-delta--positive' : 'ios-result-delta--negative'}`}>
                          {isPositive ? '+' : ''}{step.stepSize.toFixed(3)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="ios-section-footer">Tap any value to edit. Subsequent steps recalculate automatically.</p>
            </section>
          )}

          {/* #89,90 — Footer with glass divider */}
          <footer className="ios-footer">
            <p>&copy; {new Date().getFullYear()} Nils Johansson. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  )
}

export default App
