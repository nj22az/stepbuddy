import { useState, useCallback, useRef } from 'react'
import './styles.css'
import {
  SunIcon, MoonIcon, ExpandIcon, CompressIcon,
  CalcIcon, ExportIcon, TrashIcon, ErrorIcon,
  RulerIcon, FlagIcon, HashIcon, FinalFlagIcon
} from './components/Icons'
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
      value: startValue + i * stepSize,
      stepSize
    }))

    setResults(newResults)
    setCalcSuccess(true)
    setTimeout(() => setCalcSuccess(false), 400)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleStepEdit = (index, newValue) => {
    const v = parseFloat(newValue)
    if (isNaN(v)) return

    const r = [...results]
    r[index].value = v

    if (index < r.length - 1) {
      const remaining = r.length - index - 1
      const s = (parseFloat(end) - v) / remaining
      for (let i = index + 1; i < r.length; i++) {
        r[i].value = v + (i - index) * s
        r[i].stepSize = s
      }
    }
    if (index > 0) r[index - 1].stepSize = v - r[index - 1].value
    if (index < r.length - 1) r[index].stepSize = r[index + 1].value - v

    setResults(r)
  }

  const exportToCSV = () => {
    if (!results.length) return
    const csv = [
      'Step,Value,Step Size,Progress',
      ...results.map(s => {
        const ss = (parseFloat(end) - parseFloat(start)) / (results.length - 1)
        const p = ((s.number - (parseFloat(start) === 0 ? 0 : 1)) / (results.length - 1)) * 100
        return `${s.number},${s.value.toFixed(3)},${ss.toFixed(3)},${p.toFixed(1)}%`
      })
    ].join('\n')

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = 'step_sequence.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAll = () => {
    setStart(''); setEnd(''); setSteps('')
    setError(''); setResults([])
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

  const summary = results.length > 0 ? {
    range: Math.abs(results[results.length - 1].value - results[0].value),
    avg: Math.abs((parseFloat(end) - parseFloat(start)) / (results.length - 1)),
    count: results.length
  } : null

  const howTo = [
    'Enter your starting value',
    'Enter your target end value',
    'Choose how many steps (min. 2)',
    'Get evenly spaced values',
    'Export your sequence as CSV'
  ]

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="header-title">Step Buddy</div>
          <div className="header-subtitle">Step sequence calculator</div>
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
        {/* How to Use */}
        <section className="section">
          <h2 className="section-header">How to Use</h2>
          <div className="card">
            {howTo.map((text, i) => (
              <div key={i} className="step-row">
                <span className="step-num">{i + 1}</span>
                <span className="step-text">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Inputs */}
        <section className="section">
          <h2 className="section-header">Values</h2>
          <div className="card">
            <div className={`card-row${focusedInput === 'start' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="start">
                <RulerIcon /> Start
              </label>
              <input className="input" type="number" inputMode="decimal" id="start"
                step="any" placeholder="0" value={start}
                onChange={e => setStart(e.target.value)}
                onFocus={() => setFocusedInput('start')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className={`card-row${focusedInput === 'end' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="end">
                <FlagIcon /> End
              </label>
              <input className="input" type="number" inputMode="decimal" id="end"
                step="any" placeholder="100" value={end}
                onChange={e => setEnd(e.target.value)}
                onFocus={() => setFocusedInput('end')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className={`card-row${focusedInput === 'steps' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="steps">
                <HashIcon /> Steps
              </label>
              <input className="input" type="number" inputMode="numeric" id="steps"
                min="2" placeholder="Min. 2" value={steps}
                onChange={e => setSteps(e.target.value)}
                onFocus={() => setFocusedInput('steps')}
                onBlur={() => setFocusedInput(null)} />
            </div>
          </div>
          <p className="section-footer">
            Enter start, end, and number of steps to generate an evenly spaced sequence.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="error" role="alert">
            <ErrorIcon /> {error}
          </div>
        )}

        {/* Calculate */}
        <section className="section">
          <button className={`btn${calcSuccess ? ' btn--success' : ''}`}
            onClick={calculateSteps}>
            <CalcIcon /> Calculate
          </button>
        </section>

        {/* Actions */}
        {results.length > 0 && (
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
        {results.length > 0 && (
          <section className="section" ref={resultsRef}>
            <h2 className="section-header">
              Results — {results.length} steps
            </h2>
            <div className="card">
              {summary && (
                <div className="results-summary">
                  <div className="results-summary-item">
                    <div className="results-summary-label">Range</div>
                    <div className="results-summary-value">{summary.range.toFixed(2)}</div>
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Avg Step</div>
                    <div className="results-summary-value">{summary.avg.toFixed(3)}</div>
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Count</div>
                    <div className="results-summary-value">{summary.count}</div>
                  </div>
                </div>
              )}

              <div className="results-header">
                <span className="results-header-cell">#</span>
                <span className="results-header-cell">Value</span>
                <span className="results-header-cell">Delta</span>
              </div>

              {results.map((step, i) => {
                const isLast = i === results.length - 1
                const positive = step.stepSize >= 0
                const s = results[0].value
                const e = results[results.length - 1].value
                const range = e - s
                const pct = range !== 0 ? ((step.value - s) / range) * 100 : 0

                return (
                  <div key={step.number} className="result-row" style={{ '--i': i }}>
                    <div className="result-progress"
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                    <span className="result-step">{step.number}</span>
                    <div className="result-value">
                      <input type="number" className="result-value-input"
                        value={step.value.toFixed(3)}
                        onChange={e => handleStepEdit(i, e.target.value)}
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
        )}

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Nils Johansson</p>
        </footer>
      </div>
    </div>
  )
}

export default App
