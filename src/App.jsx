import { useState, useCallback, useRef } from 'react'
import './styles.css'
import {
  SunIcon, MoonIcon, ExpandIcon, CompressIcon,
  CalcIcon, ExportIcon, TrashIcon, ErrorIcon,
  RulerIcon, FlagIcon, HashIcon
} from './components/Icons'
import { useSystemTheme } from './hooks/useSystemTheme'
import {
  CLASS_IDS, CLASSES, autoSplitRanges, calcErrors,
  classifyPoint, determineBestClass, calcUncertainty
} from './lib/iso9513'

function App() {
  // Setup state
  const [instrumentId, setInstrumentId] = useState('')
  const [gaugeLength, setGaugeLength] = useState('')
  const [lmin, setLmin] = useState('')
  const [lmax, setLmax] = useState('')
  const [targetClass, setTargetClass] = useState('1')
  const [pointsPerRange, setPointsPerRange] = useState('5')
  const [standardId, setStandardId] = useState('')
  const [technician, setTechnician] = useState('')

  // Calibration state
  const [ranges, setRanges] = useState([])
  const [evaluated, setEvaluated] = useState(false)
  const [achievedClass, setAchievedClass] = useState(null)
  const [overallStatus, setOverallStatus] = useState(null)
  const [error, setError] = useState('')

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [isDarkMode, toggleTheme] = useSystemTheme()
  const resultsRef = useRef(null)

  // Generate calibration points from setup
  const generatePoints = () => {
    setError('')
    setEvaluated(false)

    const min = parseFloat(lmin)
    const max = parseFloat(lmax)
    const pts = parseInt(pointsPerRange)

    if (isNaN(min) || isNaN(max)) {
      setError('Enter valid min and max range values.')
      return
    }
    if (min <= 0) {
      setError('Minimum range must be greater than zero.')
      return
    }
    if (min >= max) {
      setError('Max must be greater than min.')
      return
    }
    if (isNaN(pts) || pts < 5) {
      setError('At least 5 calibration points per range (ISO 9513).')
      return
    }

    const newRanges = autoSplitRanges(min, max, pts)
    setRanges(newRanges)

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Update a measurement value
  const updateMeasurement = (rangeId, pointIdx, field, value) => {
    setRanges(prev => prev.map(r => {
      if (r.id !== rangeId) return r
      const points = [...r.points]
      points[pointIdx] = { ...points[pointIdx], [field]: value }
      return { ...r, points }
    }))
    setEvaluated(false)
  }

  // Evaluate all measurements
  const evaluate = () => {
    const allPoints = ranges.flatMap(r => r.points)
    const filled = allPoints.filter(p => p.measuredAsc !== '' || p.measuredDesc !== '')

    if (filled.length === 0) {
      setError('Enter at least one measurement to evaluate.')
      return
    }

    setError('')
    const best = determineBestClass(allPoints)
    setAchievedClass(best)
    setOverallStatus(best !== null && CLASS_IDS.indexOf(best) <= CLASS_IDS.indexOf(targetClass) ? 'PASS' : 'FAIL')
    setEvaluated(true)
  }

  // Export CSV
  const exportCSV = () => {
    const date = new Date().toISOString().split('T')[0]
    const meta = [
      `Instrument,${instrumentId || 'N/A'}`,
      `Gauge Length,${gaugeLength || 'N/A'} mm`,
      `Range,${lmin} - ${lmax} mm`,
      `Target Class,${targetClass}`,
      `Reference Standard,${standardId || 'N/A'}`,
      `Technician,${technician || 'N/A'}`,
      `Date,${date}`,
      `Achieved Class,${achievedClass || 'N/A'}`,
      `Status,${overallStatus || 'N/A'}`,
      '',
      'Range,Point,Reference (mm),Measured Asc (mm),Measured Desc (mm),Bias (mm),Relative Error (%),Status'
    ]

    ranges.forEach(range => {
      range.points.forEach(p => {
        const mAsc = p.measuredAsc !== '' ? parseFloat(p.measuredAsc) : null
        const mDesc = p.measuredDesc !== '' ? parseFloat(p.measuredDesc) : null
        const measured = mAsc ?? mDesc
        let bias = '', rel = '', status = ''
        if (measured !== null) {
          const e = calcErrors(p.reference, measured)
          bias = e.bias.toFixed(4)
          rel = e.relative.toFixed(3)
          status = classifyPoint(e.relative, e.biasUm, targetClass)
        }
        meta.push(`R${range.id},${p.number},${p.reference.toFixed(4)},${mAsc ?? ''},${mDesc ?? ''},${bias},${rel},${status}`)
      })
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([meta.join('\n')], { type: 'text/csv' }))
    link.download = `cal_${instrumentId || 'report'}_${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAll = () => {
    setRanges([])
    setEvaluated(false)
    setAchievedClass(null)
    setOverallStatus(null)
    setError('')
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

  const hasPoints = ranges.length > 0

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="header-title">CalWise</div>
          <div className="header-subtitle">ISO 9513 Calibration</div>
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
        {/* Instrument Setup */}
        <section className="section">
          <h2 className="section-header">Instrument</h2>
          <div className="card">
            <div className={`card-row${focusedInput === 'instrumentId' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="instrumentId">ID</label>
              <input className="input" type="text" id="instrumentId"
                placeholder="e.g. EXT-001" value={instrumentId}
                onChange={e => setInstrumentId(e.target.value)}
                onFocus={() => setFocusedInput('instrumentId')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className={`card-row${focusedInput === 'gaugeLength' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="gaugeLength">Gauge (mm)</label>
              <input className="input" type="number" inputMode="decimal" id="gaugeLength"
                step="any" placeholder="e.g. 50" value={gaugeLength}
                onChange={e => setGaugeLength(e.target.value)}
                onFocus={() => setFocusedInput('gaugeLength')}
                onBlur={() => setFocusedInput(null)} />
            </div>
          </div>
        </section>

        {/* Measurement Range */}
        <section className="section">
          <h2 className="section-header">Range & Class</h2>
          <div className="card">
            <div className={`card-row${focusedInput === 'lmin' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="lmin">
                <RulerIcon /> Min (mm)
              </label>
              <input className="input" type="number" inputMode="decimal" id="lmin"
                step="any" placeholder="0.1" value={lmin}
                onChange={e => setLmin(e.target.value)}
                onFocus={() => setFocusedInput('lmin')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className={`card-row${focusedInput === 'lmax' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="lmax">
                <FlagIcon /> Max (mm)
              </label>
              <input className="input" type="number" inputMode="decimal" id="lmax"
                step="any" placeholder="50" value={lmax}
                onChange={e => setLmax(e.target.value)}
                onFocus={() => setFocusedInput('lmax')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className={`card-row${focusedInput === 'pointsPerRange' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="pointsPerRange">
                <HashIcon /> Points
              </label>
              <input className="input" type="number" inputMode="numeric" id="pointsPerRange"
                min="5" placeholder="Min. 5" value={pointsPerRange}
                onChange={e => setPointsPerRange(e.target.value)}
                onFocus={() => setFocusedInput('pointsPerRange')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className="card-row">
              <label className="card-row-label">Class</label>
              <div className="class-selector">
                {CLASS_IDS.map(c => (
                  <button key={c}
                    className={`class-btn${targetClass === c ? ' class-btn--active' : ''}`}
                    onClick={() => setTargetClass(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Traceability */}
        <section className="section">
          <h2 className="section-header">Traceability</h2>
          <div className="card">
            <div className={`card-row${focusedInput === 'standardId' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="standardId">Standard</label>
              <input className="input" type="text" id="standardId"
                placeholder="e.g. NIST-2024-001" value={standardId}
                onChange={e => setStandardId(e.target.value)}
                onFocus={() => setFocusedInput('standardId')}
                onBlur={() => setFocusedInput(null)} />
            </div>
            <div className={`card-row${focusedInput === 'technician' ? ' card-row--focused' : ''}`}>
              <label className="card-row-label" htmlFor="technician">Technician</label>
              <input className="input" type="text" id="technician"
                placeholder="Name" value={technician}
                onChange={e => setTechnician(e.target.value)}
                onFocus={() => setFocusedInput('technician')}
                onBlur={() => setFocusedInput(null)} />
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="error" role="alert">
            <ErrorIcon /> {error}
          </div>
        )}

        {/* Generate + Evaluate */}
        <section className="section">
          {!hasPoints ? (
            <button className="btn" onClick={generatePoints}>
              <CalcIcon /> Generate Calibration Points
            </button>
          ) : (
            <div className="btn-row">
              <button className="btn" onClick={evaluate}>
                <CalcIcon /> Evaluate
              </button>
              <button className="btn btn--outline" onClick={clearAll}>
                <TrashIcon /> Clear
              </button>
            </div>
          )}
        </section>

        {/* Classification Result */}
        {evaluated && (
          <section className="section">
            <div className={`classification ${overallStatus === 'PASS' ? 'classification--pass' : 'classification--fail'}`}>
              <div className="classification-status">{overallStatus}</div>
              <div className="classification-detail">
                {achievedClass
                  ? `Achieved Class ${achievedClass} (target: ${targetClass})`
                  : `Does not meet any ISO 9513 class`}
              </div>
              <div className="classification-limits">
                Class {targetClass}: ±{CLASSES[targetClass].relativeError}% or ±{CLASSES[targetClass].biasError} μm
              </div>
            </div>
          </section>
        )}

        {/* Calibration Points — measurement entry */}
        {ranges.map(range => (
          <section className="section" key={range.id} ref={range.id === 1 ? resultsRef : null}>
            <h2 className="section-header">
              Range {range.id}: {range.start.toFixed(3)} → {range.end.toFixed(3)} mm
            </h2>
            <div className="card">
              {/* Table header */}
              <div className={`cal-header${evaluated ? ' cal-header--eval' : ''}`}>
                <span className="cal-cell cal-cell--num">#</span>
                <span className="cal-cell">Ref (mm)</span>
                <span className="cal-cell">Meas ↑</span>
                <span className="cal-cell">Meas ↓</span>
                {evaluated && <span className="cal-cell cal-cell--status">✓</span>}
              </div>

              {range.points.map((point, pi) => {
                const mAsc = point.measuredAsc !== '' ? parseFloat(point.measuredAsc) : null
                const measured = mAsc ?? (point.measuredDesc !== '' ? parseFloat(point.measuredDesc) : null)
                let pointStatus = null
                if (evaluated && measured !== null) {
                  const e = calcErrors(point.reference, measured)
                  pointStatus = classifyPoint(e.relative, e.biasUm, targetClass)
                }

                const rowCls = [
                  'cal-row',
                  evaluated ? 'cal-row--eval' : '',
                  pointStatus === 'FAIL' ? 'cal-row--fail' : ''
                ].filter(Boolean).join(' ')

                return (
                  <div key={pi} className={rowCls}>
                    <span className="cal-cell cal-cell--num">{point.number}</span>
                    <span className="cal-cell cal-cell--ref">{point.reference.toFixed(4)}</span>
                    <div className="cal-cell">
                      <input className="cal-input" type="number" inputMode="decimal"
                        step="any" placeholder="—"
                        value={point.measuredAsc}
                        onChange={e => updateMeasurement(range.id, pi, 'measuredAsc', e.target.value)} />
                    </div>
                    <div className="cal-cell">
                      <input className="cal-input" type="number" inputMode="decimal"
                        step="any" placeholder="—"
                        value={point.measuredDesc}
                        onChange={e => updateMeasurement(range.id, pi, 'measuredDesc', e.target.value)} />
                    </div>
                    {evaluated && (
                      <span className={`cal-cell cal-cell--status ${pointStatus === 'PASS' ? 'cal-pass' : 'cal-fail'}`}>
                        {pointStatus === 'PASS' ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Export */}
        {evaluated && (
          <section className="section">
            <button className="btn btn--green" onClick={exportCSV}>
              <ExportIcon /> Export Certificate CSV
            </button>
          </section>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>ISO 9513 · Johansson Engineering</p>
          <p>&copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
}

export default App
