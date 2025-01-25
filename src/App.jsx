import { useState, useEffect, useCallback } from 'react'
import './styles.css'
import Calculator from './components/Calculator'
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
      setError('Please fill in all fields with valid numbers')
      return
    }

    if (startValue === endValue) {
      setError('Start and end values must be different')
      return
    }

    if (numSteps < 2) {
      setError('Number of steps must be at least 2')
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

    // Recalculate subsequent steps with even spacing
    if (index < results.length - 1) {
      const remainingSteps = results.length - index - 1
      const stepSize = (parseFloat(end) - newValueNum) / remainingSteps
      
      for (let i = index + 1; i < results.length; i++) {
        newResults[i].value = newValueNum + (i - index) * stepSize
        newResults[i].stepSize = stepSize
      }
    }

    // Update previous step sizes
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
    document.documentElement.classList.toggle('dark-mode')
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

  return (
    <div className="container">
      <div className="app-controls">
        <button 
          className="control-button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
        </button>
        <button 
          className="control-button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      
      <header className="brand-header" role="banner">
        <div className="logo-container">
          <img src="/stepbuddy.svg" alt="Step Buddy Logo" className="logo" />
          <div>
            <h1>Step Buddy</h1>
            <p className="brand-subtitle">Precise calculations made simple</p>
          </div>
        </div>
      </header>

      <main className="content" role="main">
        <section className="instructions" aria-labelledby="instructions-title">
          <h2 id="instructions-title" className="instructions-title">How to Use</h2>
          <ol className="step-list">
            <li className="step-instruction">Enter your starting value</li>
            <li className="step-instruction">Enter your target end value</li>
            <li className="step-instruction">Choose how many steps you need (min. 2)</li>
            <li className="step-instruction">Get evenly spaced values and progress tracking</li>
            <li className="step-instruction">Export or visualize your sequence</li>
          </ol>
        </section>

        <section className="calculator" aria-label="Step Calculator">
          <div className="input-groups">
            <div className="input-group">
              <label className="input-label" htmlFor="start">Start Value</label>
              <input
                className="input-field"
                type="number"
                id="start"
                name="start"
                step="any"
                placeholder="Enter start value"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-describedby={error ? "error-message" : undefined}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="end">End Value</label>
              <input
                className="input-field"
                type="number"
                id="end"
                name="end"
                step="any"
                placeholder="Enter end value"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-describedby={error ? "error-message" : undefined}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="steps">Number of Steps</label>
              <input
                className="input-field"
                type="number"
                id="steps"
                name="steps"
                min="2"
                placeholder="Min. 2 steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                aria-describedby={error ? "error-message" : undefined}
              />
            </div>
          </div>

          {error && (
            <div id="error-message" className="error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="button-group" role="group" aria-label="Calculator Controls">
            <button 
              className="button" 
              onClick={calculateSteps}
              aria-label="Calculate Steps"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 10h16M4 16h16" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Calculate
            </button>

            {results.length > 0 && (
              <>
                <button 
                  className="button button-export" 
                  onClick={exportToCSV}
                  aria-label="Export to CSV"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export
                </button>
                <button 
                  className="button button-clear" 
                  onClick={clearAll}
                  aria-label="Clear All"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clear
                </button>
              </>
            )}
          </div>
        </section>

        {results.length > 0 && (
          <section className="results" aria-label="Step Results">
            <h2 className="results-title">Step Sequence</h2>
            <div className="results-grid">
              <div className="results-header">
                <div className="header-cell">Step</div>
                <div className="header-cell">Value</div>
                <div className="header-cell">Step Size</div>
              </div>
              <div className="results-body">
                {results.map((step, index) => (
                  <div 
                    key={step.number}
                    className="result-row"
                    style={{ '--row-index': index }}
                  >
                    <div className="result-cell number">Step {step.number}</div>
                    <div className="result-cell value">
                      <input
                        type="number"
                        className="step-value-input"
                        value={step.value.toFixed(3)}
                        onChange={(e) => handleStepEdit(index, e.target.value)}
                        step="any"
                      />
                    </div>
                    <div className="result-cell details">
                      {index < results.length - 1 ? 
                        `Δ = ${step.stepSize.toFixed(3)}` : 
                        'Final step'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="footer">
        <p className="copyright">© 2025 Nils Johansson. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
