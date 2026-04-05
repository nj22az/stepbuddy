import { useState, useEffect, useCallback } from 'react'
import './styles.css'
import { SunIcon, MoonIcon, ExpandIcon, CompressIcon } from './components/Icons'

function App() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [steps, setSteps] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

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

    const newResults = Array.from({ length: numSteps }, (_, i) => {
      const value = startValue + (i * stepSize)
      return {
        number: startValue === 0 ? i : i + 1,
        value: value,
        stepSize: stepSize
      }
    })

    setResults(newResults)
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
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'step_sequence.csv')
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

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const instructions = [
    'Enter your starting value',
    'Enter your target end value',
    'Choose how many steps you need (min. 2)',
    'Get evenly spaced values and progress tracking',
    'Export or visualize your sequence'
  ]

  return (
    <div className="ios-app">
      {/* iOS Navigation Bar */}
      <nav className="nav-bar" role="navigation">
        <div className="nav-bar-buttons">
          <button className="nav-bar-button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
          </button>
        </div>
        <span className="nav-bar-title">Step Buddy</span>
        <div className="nav-bar-buttons">
          <button className="nav-bar-button" onClick={toggleTheme} aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      {/* Large Title */}
      <div className="large-title-area">
        <h1 className="large-title">Step Buddy</h1>
        <p className="large-title-subtitle">Professional step sequence calculator</p>
      </div>

      <div className="ios-scroll-content">
        {/* How to Use Section */}
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

        {/* Calculator Inputs Section */}
        <section className="ios-section" aria-label="Calculator Inputs">
          <h2 className="ios-section-header">Values</h2>
          <div className="ios-card">
            <div className="ios-row">
              <label className="ios-row-label" htmlFor="start">Start Value</label>
              <input
                className="ios-input"
                type="number"
                id="start"
                name="start"
                step="any"
                placeholder="0"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="ios-row">
              <label className="ios-row-label" htmlFor="end">End Value</label>
              <input
                className="ios-input"
                type="number"
                id="end"
                name="end"
                step="any"
                placeholder="100"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
            <div className="ios-row">
              <label className="ios-row-label" htmlFor="steps">Steps</label>
              <input
                className="ios-input"
                type="number"
                id="steps"
                name="steps"
                min="2"
                placeholder="Min. 2"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
              />
            </div>
          </div>
          <p className="ios-section-footer">Enter a start value, end value, and number of steps to generate an evenly spaced sequence.</p>
        </section>

        {/* Error */}
        {error && (
          <div className="ios-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Calculate Button */}
        <section className="ios-section">
          <button className="ios-button-filled" onClick={calculateSteps} aria-label="Calculate Steps">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 10h16M4 16h16" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Calculate Steps
          </button>
        </section>

        {/* Action buttons when results exist */}
        {results.length > 0 && (
          <section className="ios-section">
            <div className="ios-button-row">
              <button className="ios-button-filled green" onClick={exportToCSV} aria-label="Export to CSV">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export CSV
              </button>
              <button className="ios-button-filled red" onClick={clearAll} aria-label="Clear All">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear
              </button>
            </div>
          </section>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <section className="ios-section" aria-label="Step Results">
            <h2 className="ios-section-header">Step Sequence — {results.length} steps</h2>
            <div className="ios-card">
              <div className="ios-results-header">
                <span className="ios-results-header-cell">Step</span>
                <span className="ios-results-header-cell">Value</span>
                <span className="ios-results-header-cell">Delta</span>
              </div>
              {results.map((step, index) => (
                <div
                  key={step.number}
                  className="ios-result-row"
                  style={{ '--row-index': index }}
                >
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
                  <span className="ios-result-delta">
                    {index < results.length - 1
                      ? `${step.stepSize >= 0 ? '+' : ''}${step.stepSize.toFixed(3)}`
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
            <p className="ios-section-footer">Tap any value to edit. Subsequent steps recalculate automatically.</p>
          </section>
        )}

        {/* Footer */}
        <footer className="ios-footer">
          <p>&copy; 2025 Nils Johansson. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default App
