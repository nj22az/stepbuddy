import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import './styles.css'
import { generateSequence, editSequence, MAX_POINTS } from './sequence'
import { PlannerIntro } from './components/PlannerIntro'
import {
  SunIcon, MoonIcon,
  CalcIcon, ExportIcon, TrashIcon, ErrorIcon,
  RulerIcon, FlagIcon, HashIcon,
  PlusIcon, CloseIcon, ChevronIcon
} from './components/Icons'
import { useSystemTheme } from './hooks/useSystemTheme'
import {
  UNIT_GROUPS, GROUP_ORDER, STANDARD_GRAVITY,
  convert, canConvert, needsGravity, unitLabel, secondaryOptionsFor, hasGravityDependent,
} from './units'
import {
  GRAVITY_DB, COUNTRY_ORDER, regionsFor, gravityFor, findLocation,
} from './gravityDatabase'
import {
  STEPS, defaultTest, loadTest, saveTest, stepStatus,
  tolerancesFor, classifyError, repeatError, meanIndicated,
  classOf, resolutionPct, systemClass,
} from './test'
const SiteScreen = lazy(() => import('./screens/SiteScreen').then(module => ({ default: module.SiteScreen })))
const EquipmentScreen = lazy(() => import('./screens/EquipmentScreen').then(module => ({ default: module.EquipmentScreen })))
const StandardScreen = lazy(() => import('./screens/StandardScreen').then(module => ({ default: module.StandardScreen })))
const NotesScreen = lazy(() => import('./screens/NotesScreen').then(module => ({ default: module.NotesScreen })))
const PreviewScreen = lazy(() => import('./screens/PreviewScreen').then(module => ({ default: module.PreviewScreen })))
import { UnlockModal } from './components/UnlockModal'
import { isUnlocked, setUnlocked, gateActive } from './auth'

let nextRangeId = 1

// Generic span patterns. Legacy ids preserve compatibility with saved ranges.
const PERCENT_PRESETS = {
  'iso-7500-low':  { label: 'Low-range pattern (0–100%)',        values: [0, 2, 5, 10, 20, 40, 60, 80, 100] },
  'iso-7500':      { label: 'Five-point pattern (20–100%)',        values: [20, 40, 60, 80, 100] },
  'iso-7500-zero': { label: 'Six-point pattern (0–100%)',     values: [0, 20, 40, 60, 80, 100] },
  'iso-9513':      { label: 'Displacement pattern (20–100%)',          values: [20, 40, 60, 80, 100] },
  'iso-376':       { label: 'Ten-point pattern (10–100%)',          values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
  'custom':        { label: 'Custom',                       values: null },
}

const DEFAULT_PRESET = 'iso-7500-low'
const presetToList = (key) => (PERCENT_PRESETS[key]?.values ?? []).map(String)

function createRange() {
  return {
    id: nextRangeId++,
    label: '',
    decimals: 3,
    start: '',
    end: '',
    steps: '',
    mode: 'absolute',
    preset: DEFAULT_PRESET,
    percentList: presetToList(DEFAULT_PRESET),
    unit: '',
    secondaryUnit: '',
    gravity: STANDARD_GRAVITY,
    gravityCountry: 'Reference',
    gravityRegion: 'Standard g₀ (9.80665)',
    kgfMode: 'standard', // 'local' = 1 kgf = 1 kg × local g (deadweight practice)
                      // 'standard' = 1 kgf = 9.80665 N fixed (strict ISO)
    calibrationMode: false, // results card shows Indicated + Error% columns when true
    resolution: '', // indicator resolution at this range, e.g. 0.000025 N — used for Resolution Class
    optionsOpen: false,
    results: [],
    error: '',
  }
}

// Shows the live gravity value beneath the picker when it actually affects
// the result. Also explains the kgf mode when a grav-force unit is involved
// but gravity doesn't currently apply (e.g. standard mode for N ↔ kgf).
function conversionHint(range) {
  const { unit, secondaryUnit, gravity, kgfMode } = range
  if (needsGravity(unit, secondaryUnit, kgfMode)) {
    return `${unitLabel(unit)} ↔ ${unitLabel(secondaryUnit)} uses local gravity g = ${Number(gravity).toFixed(4)} m/s².`
  }
  if (hasGravityDependent(unit, secondaryUnit) && kgfMode === 'standard') {
    return `kgf / lbf fixed at standard g₀ = 9.80665 (strict ISO). Switch to Local g to apply your lab's gravity.`
  }
  return null
}

// Human-readable summary of the current unit/gravity config, shown on the
// disclosure row so the user doesn't have to expand to see what's set.
function unitsSummary(range) {
  const primary = unitLabel(range.unit)
  const secondary = unitLabel(range.secondaryUnit)
  if (!primary) return 'None'
  if (!secondary) return primary
  const pair = `${primary} → ${secondary}`
  if (needsGravity(range.unit, range.secondaryUnit, range.kgfMode)) {
    return `${pair} · g=${Number(range.gravity).toFixed(4)}`
  }
  if (hasGravityDependent(range.unit, range.secondaryUnit) && range.kgfMode === 'standard') {
    return `${pair} · std g₀`
  }
  return pair
}

function App() {
  // The whole calibration test document — everything except `ranges`
  // (which keeps its richer existing shape with results + edit history).
  const [test, setTest] = useState(loadTest)
  const [ranges, setRanges] = useState(() => {
    const loaded = loadTest()
    if (loaded.__ranges?.length) {
      nextRangeId = Math.max(nextRangeId, ...loaded.__ranges.map(r => (Number(r.id) || 0) + 1))
      return loaded.__ranges
    }
    return [createRange()]
  })
  const [focusedInput, setFocusedInput] = useState(null)
  const [calcSuccess, setCalcSuccess] = useState(null)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [workspaceMode, setWorkspaceMode] = useState('planner')
  const [notice, setNotice] = useState('')
  const [visiblePoints, setVisiblePoints] = useState({})

  // Auto-save the document on any change. Lightweight enough — JSON
  // serialise of ~5 KB tops on a typical session, runs at React commit.
  useEffect(() => {
    if (!saveTest({ ...test, __ranges: ranges })) setNotice('Browser storage is unavailable. Copy or export your plan before closing.')
  }, [test, ranges])

  const patchTest = (updates) => setTest(prev => ({ ...prev, ...updates }))
  const setActiveStep = (id) => patchTest({ activeStep: id })
  const activeStep = test.activeStep || 'site'

  const [isDarkMode, toggleTheme] = useSystemTheme()
  const resultsRef = useRef(null)

  // Calibration-suite gate. When locked, only the simple StepWise calculator
  // (Ranges step content) is rendered. Hidden trigger: 5 quick taps on the
  // logo within 2 s, or visit with #unlock in the URL.
  const [unlocked, setUnlockedState] = useState(isUnlocked)
  const [showUnlock, setShowUnlock] = useState(false)
  const suiteEnabled = unlocked && workspaceMode === 'record'
  const tapCount = useRef(0)
  const tapTimer = useRef(null)
  const triggerUnlockPrompt = () => {
    if (unlocked) return
    if (!gateActive()) { setUnlockedState(true); return }
    setShowUnlock(true)
  }
  const onLogoTap = () => {
    tapCount.current += 1
    clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 2000)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      triggerUnlockPrompt()
    } else if (!unlocked) {
      // Default behaviour for non-trigger taps: open the logo zoom modal.
      // Only swallow once 5 taps reached.
      setShowLogoModal(true)
    } else {
      setShowLogoModal(true)
    }
  }
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkHash = () => {
      if (window.location.hash === '#unlock') {
        history.replaceState(null, '', window.location.pathname + window.location.search)
        triggerUnlockPrompt()
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked])
  const lock = () => {
    setUnlocked(false)
    setUnlockedState(false)
    setWorkspaceMode('planner')
    patchTest({ activeStep: 'ranges' })
  }

  const updateRange = (id, updates) => {
    const changesPlan = ['start', 'end', 'steps', 'mode', 'percentList', 'unit', 'gravity', 'kgfMode'].some(k => k in updates)
    setRanges(prev => prev.map(r => r.id === id ? { ...r, ...updates, ...(changesPlan ? { results: [], error: '' } : {}) } : r))
  }

  const addRange = () => {
    setRanges(prev => [...prev, createRange()])
  }

  const removeRange = (id) => {
    setRanges(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
  }

  const calculateAll = () => {
    const calculated = ranges.map(range => {
      try {
        if (needsGravity(range.unit, range.secondaryUnit, range.kgfMode) && !(Number(range.gravity) > 0)) throw new Error('Set a positive gravity value for this conversion.')
        return { ...range, results: generateSequence(range), error: '' }
      }
      catch (error) { return { ...range, results: [], error: error.message } }
    })
    setRanges(calculated)
    setVisiblePoints({})
    const failed = calculated.filter(r => r.error)
    if (suiteEnabled && !failed.length) setActiveStep('verify')
    setNotice(failed.length
      ? `Check ${failed.length} range${failed.length === 1 ? '' : 's'} highlighted below. ${calculated.filter(r => !r.error).length} ranges generated successfully.`
      : 'Your test points are ready. Review them below, then choose Copy points or Export CSV.')
    if (failed.length) {
      setTimeout(() => document.getElementById(`range-error-${failed[0].id}`)?.focus(), 80)
      return
    }
    setCalcSuccess(true)
    setTimeout(() => setCalcSuccess(false), 400)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 80)
  }

  const loadExample = (example) => {
    const range = { ...createRange(), ...example, id: nextRangeId++, label: example.title, results: [], error: '' }
    range.results = generateSequence(range)
    setRanges(prev => prev.length === 1 && prev[0].start === '' && prev[0].end === '' && !prev[0].results.length ? [range] : [...prev, range])
    setVisiblePoints({})
    setWorkspaceMode('planner')
    setNotice(`${example.title} example added. Your existing ranges are retained.`)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' }), 80)
  }

  const copyResults = async () => {
    const lines = ['Range\tPoint\tTarget\tUnit', ...ranges.flatMap((r, ri) => r.results.map(p => `${r.label || `Range ${ri + 1}`}\t${p.number}\t${p.value}\t${unitLabel(r.unit)}`))]
    try { await navigator.clipboard.writeText(lines.join('\n')); setNotice('Test points copied. Paste into a worksheet or work instruction.') }
    catch { setNotice('Clipboard access is unavailable. Use Export CSV instead.') }
  }

  const handleRunEdit = (rangeId, index, runIdx, newValue) => {
    setRanges(prev => prev.map(range => {
      if (range.id !== rangeId) return range
      const r = [...range.results]
      const runs = (r[index].runs && [...r[index].runs]) || Array(test.standard.runs).fill('')
      while (runs.length < test.standard.runs) runs.push('')
      runs[runIdx] = newValue
      r[index] = { ...r[index], runs, indicated: runs[0] }
      return { ...range, results: r }
    }))
  }

  const handleStepEdit = (rangeId, index, newValue) => {
    if (String(newValue).trim() === '' || !Number.isFinite(Number(newValue))) return
    setRanges(prev => prev.map(range => range.id !== rangeId ? range : {
      ...range, results: editSequence(range.results, index, Number(newValue), range.end, range.mode)
    }))
  }

  const exportToCSV = () => {
    const rangesWithResults = ranges.filter(r => r.results.length > 0)
    if (!rangesWithResults.length) return

    const anySecondary = rangesWithResults.some(r => canConvert(r.unit, r.secondaryUnit))
    const anyCal = suiteEnabled && rangesWithResults.some(r => r.calibrationMode)
    const csvEsc = (s) => {
      let v = String(s ?? '')
      if (/^[=+@-]/.test(v) && !Number.isFinite(Number(v))) v = "'" + v
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
    }

    const rows = []
    // Metadata header — only when unlocked (calibration suite); otherwise
    // the simple StepWise CSV stays a clean numbers-only export.
    if (suiteEnabled) {
      const metaPairs = []
      const flat = (obj, prefix) => Object.entries(obj || {}).forEach(([k, v]) => {
        if (typeof v === 'object' || typeof v === 'boolean' || v == null) return
        if (String(v).trim() !== '') metaPairs.push([`${prefix}.${k}`, v])
      })
      flat(test.site, 'site')
      flat(test.machine, 'machine')
      flat(test.transducer, 'transducer')
      flat(test.tempStandard, 'tempStandard')
      flat(test.standard, 'standard')
      flat(test.notes, 'notes')
      if (metaPairs.length) {
        rows.push('# Calibration setup')
        metaPairs.forEach(([k, v]) => rows.push(`# ${k},${csvEsc(v)}`))
        rows.push(`# Exported,${new Date().toISOString()}`)
        rows.push('')
      }
    }

    const headerCols = ['Range', 'Step', 'Applied', 'Unit', 'Step Size']
    if (anyCal) headerCols.push('Indicated', 'Error %')
    if (anySecondary) headerCols.push('Secondary', 'Secondary Unit')
    rows.push(headerCols.join(','))

    rangesWithResults.forEach((range, ri) => {
      const label = range.label || (rangesWithResults.length > 1 ? `Range ${ri + 1}` : '')
      const unit = unitLabel(range.unit)
      const secondaryUnit = unitLabel(range.secondaryUnit)
      const hasSecondary = canConvert(range.unit, range.secondaryUnit)
      range.results.forEach(s => {
        const cols = [label, s.number, String(s.value), unit, String(s.stepSize)]
        if (anyCal) {
          if (range.calibrationMode) {
            const ind = parseFloat(s.indicated)
            const err = (Number.isFinite(ind) && s.value !== 0) ? ((ind - s.value) / s.value) * 100 : null
            cols.push(Number.isFinite(ind) ? ind.toFixed(3) : '')
            cols.push(err == null ? '' : err.toFixed(3))
          } else {
            cols.push('', '')
          }
        }
        if (anySecondary) {
          if (hasSecondary) {
            const sv = convert(s.value, range.unit, range.secondaryUnit, range.gravity, range.kgfMode)
            cols.push(String(sv), secondaryUnit)
          } else {
            cols.push('', '')
          }
        }
        rows.push(cols.map(csvEsc).join(','))
      })
    })

    const link = document.createElement('a')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    link.href = url
    link.download = 'stepwise-test-points.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const clearAll = () => {
    if (ranges.some(r => r.results.length || r.start || r.end) && !window.confirm('Clear all ranges and their readings? Export your work first if you need a copy.')) return
    setRanges([createRange()])
    setNotice('Ranges cleared.')
  }

  const hasAnyResults = ranges.some(r => r.results.length > 0)
  const multiRange = ranges.length > 1

  return (
    <div className="app">
      {/* Unlock modal */}
      {showUnlock && !unlocked && (
        <UnlockModal
          onClose={() => setShowUnlock(false)}
          onUnlock={() => { setUnlocked(true); setUnlockedState(true); setWorkspaceMode('record'); setShowUnlock(false) }}
        />
      )}

      {/* Logo zoom modal */}
      {showLogoModal && (
        <div className="logo-modal" onClick={() => setShowLogoModal(false)}>
          <div className="logo-modal-content">
            <span className="app-symbol app-symbol--large" aria-hidden="true">SW</span>
            <div className="logo-modal-title">StepWise</div>
            <div className="logo-modal-subtitle">Test-point planning</div>
          </div>
        </div>
      )}

      {/* Header — two bento cards */}
      <header className="header">
        <button className="header-logo-btn" onClick={onLogoTap}
          aria-label="View logo">
          <span className="app-symbol" aria-hidden="true">SW</span>
        </button>
        <div className="header-text">
          <div className="header-title">StepWise</div>
          <div className="header-subtitle">Test-point planner</div>
          <div className="header-buttons">
            {suiteEnabled && gateActive() && (
              <button className="header-btn header-btn--lock" onClick={lock}
                aria-label="Lock calibration suite" title="Lock calibration suite">
                🔒
              </button>
            )}
            <button className="header-btn" onClick={toggleTheme}
              aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}>
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className="app-content">
        <div className="workspace-switch" role="group" aria-label="Workspace">
          <button type="button" aria-pressed={!suiteEnabled} onClick={() => setWorkspaceMode('planner')}>Test-point planner</button>
          <button type="button" aria-pressed={suiteEnabled} onClick={() => { if (unlocked) setWorkspaceMode('record'); else triggerUnlockPrompt() }}>Advanced record</button>
          <a href="https://nj22az.github.io/#projects">All projects ↗</a>
        </div>
        {!suiteEnabled && <PlannerIntro onExample={loadExample} />}
        {suiteEnabled && <p className="record-note">Advanced working record · Review the selected method, calculations and completeness before using any result. The planner remains available in the other workspace.</p>}
        {notice && <p className="planner-notice" role="status">{notice}</p>}

        {/* App title bento */}
        {suiteEnabled && <section className="section">
          <div className="card title-card">
            <div className="title-card-text">
              {suiteEnabled ? 'Advanced working record' : 'Test-point planner'}
              {suiteEnabled && (
                <span className="title-card-sub">
                  {test.standard.id.toUpperCase()} · Class {test.standard.accuracyClass} · {test.standard.mode}
                </span>
              )}
            </div>
          </div>
        </section>

        }

        {/* All steps wrap within the available width. */}
        {suiteEnabled && (
        <nav className="wizard-nav" aria-label="Calibration steps">
          {STEPS.map(step => {
            const status = stepStatus(test, ranges, step.id)
            const isActive = activeStep === step.id
            return (
              <button key={step.id} type="button"
                className={`wizard-pill${isActive ? ' wizard-pill--active' : ''}${status === 'complete' ? ' wizard-pill--done' : ''}`}
                onClick={() => setActiveStep(step.id)}
                aria-current={isActive ? 'step' : undefined}>
                <span className="wizard-pill-n">{status === 'complete' ? '✓' : step.n}</span>
                <span className="wizard-pill-label">{step.label}</span>
              </button>
            )
          })}
        </nav>
        )}

        {/* Advanced screens load only when opened. */}
        <Suspense fallback={<p className="record-note" role="status">Loading working record…</p>}>
        {suiteEnabled && activeStep === 'site'      && <SiteScreen      test={test} patch={patchTest} />}
        {suiteEnabled && activeStep === 'equipment' && <EquipmentScreen test={test} patch={patchTest} />}
        {suiteEnabled && activeStep === 'standard'  && <StandardScreen  test={test} patch={patchTest} />}
        {suiteEnabled && activeStep === 'notes'     && <NotesScreen     test={test} patch={patchTest} />}
        {suiteEnabled && activeStep === 'preview'   && <PreviewScreen   test={test} ranges={ranges} />}
        </Suspense>

        {(!suiteEnabled || activeStep === 'ranges') && (<>
        {/* Range Inputs */}
        {ranges.map((range, ri) => (
          <section className="section" key={range.id}>
            <div className="section-header-row">
              <h2 className="section-header">
                {range.label || (multiRange ? `Range ${ri + 1}` : 'Your measurement range')}
              </h2>
              {multiRange && (
                <button className="range-remove-btn" onClick={() => removeRange(range.id)}
                  aria-label={`Remove range ${ri + 1}`}>
                  <CloseIcon />
                </button>
              )}
            </div>
            <div className="card">
              <div className="card-row"><label className="card-row-label" htmlFor={`range-name-${range.id}`}>Range name (optional)</label><input className="input" id={`range-name-${range.id}`} placeholder="e.g. Pump pressure" value={range.label || ''} onChange={e => updateRange(range.id, { label: e.target.value })} /></div>

              <div className="card-row"><label className="card-row-label" htmlFor={`unit-${range.id}`}>Measurement unit</label>
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
              </div>
              <div className="card-row mode-toggle" role="tablist" aria-label="Step input mode">
                <button type="button" role="tab"
                  aria-selected={range.mode === 'absolute'}
                  className={`mode-btn${range.mode === 'absolute' ? ' mode-btn--active' : ''}`}
                  onClick={() => updateRange(range.id, { mode: 'absolute' })}>
                  Even spacing
                </button>
                <button type="button" role="tab"
                  aria-selected={range.mode === 'percentage'}
                  className={`mode-btn${range.mode === 'percentage' ? ' mode-btn--active' : ''}`}
                  onClick={() => updateRange(range.id, { mode: 'percentage' })}>
                  Percentage of span
                </button>
              </div>
              <button type="button" className="card-row options-toggle"
                onClick={() => updateRange(range.id, { optionsOpen: !range.optionsOpen })}
                aria-expanded={range.optionsOpen}>
                <span className="card-row-label">
                  <ChevronIcon expanded={range.optionsOpen} /> Conversion &amp; display
                </span>
                <span className="options-summary">{unitsSummary(range)}</span>
              </button>
              {range.optionsOpen && (
                <>
              <div className="card-row"><label className="card-row-label" htmlFor={`decimals-${range.id}`}>Display decimals</label><select className="input input--select" id={`decimals-${range.id}`} value={range.decimals ?? 3} onChange={e => updateRange(range.id, { decimals: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></div>
                  <div className={`card-row${focusedInput === `unit-${range.id}` ? ' card-row--focused' : ''}`}>
                    <label className="card-row-label" htmlFor={`secondary-unit-${range.id}`}>
                      Secondary unit
                    </label>
                    <div className="secondary-picker">
                      <select className="input input--select unit-select" id={`secondary-unit-${range.id}`}
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
                  {hasGravityDependent(range.unit, range.secondaryUnit) && (
                    <div className="card-row kgf-mode-row">
                      <span className="card-row-label">kgf / lbf</span>
                      <div className="kgf-mode-toggle" role="tablist" aria-label="kgf definition">
                        <button type="button" role="tab"
                          aria-selected={range.kgfMode === 'local'}
                          className={`kgf-mode-btn${range.kgfMode === 'local' ? ' kgf-mode-btn--active' : ''}`}
                          onClick={() => updateRange(range.id, { kgfMode: 'local' })}>
                          Local g
                        </button>
                        <button type="button" role="tab"
                          aria-selected={range.kgfMode === 'standard'}
                          className={`kgf-mode-btn${range.kgfMode === 'standard' ? ' kgf-mode-btn--active' : ''}`}
                          onClick={() => updateRange(range.id, { kgfMode: 'standard' })}>
                          Standard g₀
                        </button>
                      </div>
                    </div>
                  )}
                  {needsGravity(range.unit, range.secondaryUnit, range.kgfMode) && (
                    <>
                      <div className={`card-row${focusedInput === `gravity-${range.id}` ? ' card-row--focused' : ''}`}>
                        <label className="card-row-label" htmlFor={`gravity-${range.id}`}>
                          Gravity g
                        </label>
                        <div className="gravity-picker">
                          <input className="input gravity-input" type="number" inputMode="decimal"
                            id={`gravity-${range.id}`} step="any" min="0"
                            value={range.gravity}
                            onChange={e => {
                              const v = parseFloat(e.target.value) || 0
                              const loc = findLocation(v)
                              updateRange(range.id, {
                                gravity: v,
                                gravityCountry: loc.country,
                                gravityRegion: loc.region,
                              })
                            }}
                            onFocus={() => setFocusedInput(`gravity-${range.id}`)}
                            onBlur={() => setFocusedInput(null)} />
                          <span className="gravity-unit">m/s²</span>
                        </div>
                      </div>
                      <div className="card-row location-row">
                        <span className="card-row-label">Location</span>
                        <div className="location-picker">
                          <select className="input input--select location-select"
                            aria-label="Country"
                            value={range.gravityCountry}
                            onChange={e => {
                              const country = e.target.value
                              const regions = regionsFor(country)
                              const region = regions[0]
                              const g = gravityFor(country, region)
                              updateRange(range.id, {
                                gravityCountry: country,
                                gravityRegion: region,
                                ...(g != null ? { gravity: g } : {}),
                              })
                            }}>
                            {COUNTRY_ORDER.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <select className="input input--select location-select"
                            aria-label="Region or city"
                            value={range.gravityRegion}
                            onChange={e => {
                              const region = e.target.value
                              const g = gravityFor(range.gravityCountry, region)
                              updateRange(range.id, {
                                gravityRegion: region,
                                ...(g != null ? { gravity: g } : {}),
                              })
                            }}>
                            {regionsFor(range.gravityCountry).map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  {conversionHint(range) && (
                    <p className="options-note">{conversionHint(range)}</p>
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
                    <HashIcon /> Number of points
                  </label>
                  <input className="input" type="number" inputMode="numeric" id={`steps-${range.id}`}
                    min="2" max={MAX_POINTS} step="1" placeholder="Includes both endpoints" value={range.steps}
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
                  <div className="card-row points-header">
                    <span className="card-row-label">
                      <HashIcon /> Points %
                    </span>
                    <span className="points-count">{range.percentList.length} {range.percentList.length === 1 ? 'point' : 'points'}</span>
                  </div>
                  {range.percentList.map((val, pi) => {
                    const startN = parseFloat(range.start)
                    const endN = parseFloat(range.end)
                    const pctN = parseFloat(val)
                    const suggested = (Number.isFinite(startN) && Number.isFinite(endN) && Number.isFinite(pctN))
                      ? startN + (pctN / 100) * (endN - startN)
                      : null
                    const unitLbl = unitLabel(range.unit)
                    return (
                      <div key={pi}
                        className={`card-row point-row${focusedInput === `percent-${range.id}-${pi}` ? ' card-row--focused' : ''}`}>
                        <span className="point-index">{pi + 1}</span>
                        <input className="input point-input"
                          type="number" inputMode="decimal" step="any"
                          aria-label={`Point ${pi + 1} percentage`}
                          value={val}
                          onChange={e => {
                            const next = [...range.percentList]
                            next[pi] = e.target.value
                            updateRange(range.id, { percentList: next, preset: 'custom' })
                          }}
                          onFocus={() => setFocusedInput(`percent-${range.id}-${pi}`)}
                          onBlur={() => setFocusedInput(null)} />
                        <span className="point-suffix">%</span>
                        {suggested != null && (
                          <span className="point-suggested" aria-label="Suggested value">
                            → {suggested.toFixed(3)}{unitLbl ? ` ${unitLbl}` : ''}
                          </span>
                        )}
                        <button type="button" className="point-remove"
                          aria-label={`Remove point ${pi + 1}`}
                          disabled={range.percentList.length <= 2}
                          onClick={() => {
                            const next = range.percentList.filter((_, j) => j !== pi)
                            updateRange(range.id, { percentList: next, preset: 'custom' })
                          }}>
                          <CloseIcon />
                        </button>
                      </div>
                    )
                  })}
                  <button type="button" className="card-row add-point"
                    onClick={() => {
                      const nums = range.percentList.map(parseFloat).filter(Number.isFinite)
                      const last = nums.length ? nums[nums.length - 1] : 0
                      const nextVal = last < 100 ? Math.min(100, last + 10) : last + 10
                      updateRange(range.id, {
                        percentList: [...range.percentList, String(nextVal)],
                        preset: 'custom',
                      })
                    }}>
                    <PlusIcon /> Add point
                  </button>
                </>
              )}
            </div>
            {ri === 0 && !hasAnyResults && (
              <p className="section-footer">
                {range.mode === 'absolute'
                  ? 'Points include both endpoints: five points make four intervals. Add units under Units & gravity.'
                  : 'Percentages are measured along the span from Start (0%) to End (100%). Patterns are planning aids; choose points for your approved procedure.'}
              </p>
            )}
            {range.error && (
              <div className="error" role="alert" id={`range-error-${range.id}`} tabIndex={-1}>
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
              <CalcIcon /> Generate test points
            </button>
          </div>
        </section>

        {/* Export / Clear */}
        {hasAnyResults && (
          <section className="section">
            <div className="btn-row">
              <button className="btn btn--green" onClick={exportToCSV}>
                <ExportIcon /> Export CSV
              </button>
              <button className="btn btn--outline" onClick={copyResults}>Copy points</button>
              <button className="btn btn--outline" onClick={clearAll}>
                <TrashIcon /> Clear
              </button>
            </div>
          </section>
        )}
        </>)}

        {/* Results — public when locked (simple StepWise), gated to Verify step when unlocked */}
        {(!suiteEnabled || activeStep === 'verify') && (<>
        {!hasAnyResults && (
          <section className="section">
            <div className="card title-card">
              <div className="title-card-text">
                No points generated yet. Configure a range, then choose Generate test points.
              </div>
            </div>
          </section>
        )}
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
            ? convert(v, range.unit, range.secondaryUnit, range.gravity, range.kgfMode)
            : null

          const cal = suiteEnabled && range.calibrationMode
          return (
            <section className="section" key={`results-${range.id}`}
              ref={range.id === ranges.find(r => r.results.length)?.id ? resultsRef : null}>
              <div className="section-header-row">
                <h2 className="section-header">
                  {multiRange
                    ? `${range.label || `Range ${ri + 1}`} — ${range.results.length} points`
                    : `Test points — ${range.results.length} points`}
                </h2>
                {suiteEnabled && (
                  <button type="button"
                    className={`cal-toggle${cal ? ' cal-toggle--on' : ''}`}
                    onClick={() => updateRange(range.id, { calibrationMode: !cal })}
                    aria-pressed={cal}>
                    {cal ? '● Calibration mode' : '○ Calibration mode'}
                  </button>
                )}
              </div>
              <div className={`card${cal ? ' card--calibration' : ''}`}>
                {cal && (
                  <div className="card-row resolution-row">
                    <label className="card-row-label" htmlFor={`res-${range.id}`}>
                      Indicator resolution
                    </label>
                    <div className="capacity-picker">
                      <input id={`res-${range.id}`} className="input capacity-input"
                        type="number" inputMode="decimal" step="any"
                        placeholder="0.000025"
                        value={range.resolution || ''}
                        onChange={e => updateRange(range.id, { resolution: e.target.value })} />
                      <span className="gravity-unit">{primaryLabel || ''}</span>
                    </div>
                  </div>
                )}
                <div className="results-summary">
                  <div className="results-summary-item">
                    <div className="results-summary-label">From → To</div>
                    <div className="results-summary-value">
                      {summary.from.toFixed(range.decimals ?? 3)} → {summary.to.toFixed(range.decimals ?? 3)}{primaryLabel ? ` ${primaryLabel}` : ''}
                    </div>
                    {hasSecondary && (
                      <div className="results-summary-secondary">
                        {secondaryOf(summary.from).toFixed(range.decimals ?? 3)} → {secondaryOf(summary.to).toFixed(range.decimals ?? 3)} {secondaryLabel}
                      </div>
                    )}
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Average spacing</div>
                    <div className="results-summary-value">
                      {summary.avg.toFixed(range.decimals ?? 3)}{primaryLabel ? ` ${primaryLabel}` : ''}
                    </div>
                  </div>
                  <div className="results-summary-item">
                    <div className="results-summary-label">Points</div>
                    <div className="results-summary-value">{summary.count}</div>
                  </div>
                </div>

                <div className={`results-header${cal ? ' results-header--cal' : ''}`}>
                  <span className="results-header-cell">#</span>
                  <span className="results-header-cell">Target value</span>
                  {cal && <span className="results-header-cell">{test.standard.runs > 1 ? `${test.standard.runs} Runs` : 'Indicated'}</span>}
                  {cal && <span className="results-header-cell">Error / Repeat</span>}
                  {!cal && <span className="results-header-cell">Change</span>}
                </div>

                {range.results.slice(0, visiblePoints[range.id] || 50).map((step, i) => {
                  const positive = step.stepSize >= 0
                  const s = range.results[0].value
                  const e = range.results[range.results.length - 1].value
                  const rangeSpan = e - s
                  const pct = rangeSpan !== 0 ? ((step.value - s) / rangeSpan) * 100 : 0
                  const secondaryValue = secondaryOf(step.value)
                  const runs = step.runs && step.runs.length
                    ? step.runs
                    : Array(test.standard.runs).fill(step.indicated ?? '')
                  const mean = meanIndicated(runs)
                  const errorPct = (mean != null && step.value !== 0)
                    ? ((mean - step.value) / step.value) * 100
                    : null
                  const repeatPct = repeatError(runs)
                  const tol = tolerancesFor(test)
                  const errClass = classifyError(errorPct, tol.errMax)
                  const errorClass = errClass ? `cal-error--${errClass}` : ''
                  const resPct = resolutionPct(range.resolution, step.value)
                  const resCls = classOf(resPct, 'resolution')
                  const repCls = classOf(repeatPct)
                  const errCls = classOf(errorPct)
                  const sysCls = systemClass(resCls, test.standard.referenceClass, repCls, errCls)
                  const sysClsClassName = sysCls ? `class-chip class-chip--${classOf(parseFloat(sysCls), 'err') || 'bad'}` : ''

                  return (
                    <div key={step.number}
                      className={`result-row${cal ? ' result-row--cal' : ''}`}
                      style={{ '--i': i }}>
                      <div className="result-progress"
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      <span className="result-step">{step.number}</span>
                      <div className="result-value" data-label="Target value">
                        <div className="result-value-primary">
                          <input type="number" className="result-value-input"
                            key={`${step.value}-${range.decimals ?? 3}`}
                            defaultValue={step.value.toFixed(range.decimals ?? 3)}
                            aria-label={`Point ${step.number} target value`}
                            onBlur={ev => { if (ev.target.value !== step.value.toFixed(range.decimals ?? 3)) handleStepEdit(range.id, i, ev.target.value) }}
                            step="any" />
                          {primaryLabel && (
                            <span className="result-value-unit">{primaryLabel}</span>
                          )}
                        </div>
                        {secondaryValue != null && (
                          <div className="result-value-secondary">
                            {secondaryValue.toFixed(range.decimals ?? 3)} {secondaryLabel}
                          </div>
                        )}
                      </div>
                      {cal ? (
                        <>
                          <div className="cal-runs" data-label="Indicated readings">
                            {Array.from({ length: test.standard.runs }).map((_, ri2) => (
                              <input key={ri2} type="number" className="cal-indicated"
                                placeholder={`Run ${ri2 + 1}`}
                                inputMode="decimal" step="any"
                                aria-label={`Step ${step.number} run ${ri2 + 1}`}
                                value={runs[ri2] ?? ''}
                                onChange={ev => handleRunEdit(range.id, i, ri2, ev.target.value)} />
                            ))}
                          </div>
                          <div className="cal-stats" data-label="Error / Repeat">
                            <span className={`cal-error ${errorClass}`}>
                              {errorPct == null ? '—' : `${errorPct >= 0 ? '+' : ''}${errorPct.toFixed(2)}%`}
                            </span>
                            {repeatPct != null && (
                              <span className="cal-repeat">±{repeatPct.toFixed(2)}%</span>
                            )}
                            {sysCls && (
                              <span className={sysClsClassName} title={`Resolution ${resCls || '—'} · Standard ${test.standard.referenceClass} · Repeat ${repCls || '—'} · Error ${errCls || '—'}`}>
                                Class {sysCls}
                              </span>
                            )}
                          </div>
                        </>
                      ) : i === 0 ? (
                        <span className="result-delta result-delta--neutral">
                          <span className="result-final">
                            Start
                          </span>
                        </span>
                      ) : (
                        <span className={`result-delta ${positive ? 'result-delta--positive' : 'result-delta--negative'}`}>
                          <span className="result-change-label">Change </span>{positive ? '+' : ''}{step.stepSize.toFixed(range.decimals ?? 3)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {range.results.length > (visiblePoints[range.id] || 50) && <button type="button" className="btn show-points" onClick={() => setVisiblePoints(prev => ({ ...prev, [range.id]: (prev[range.id] || 50) + 50 }))}>Show next {Math.min(50, range.results.length - (visiblePoints[range.id] || 50))} points ({Math.min(visiblePoints[range.id] || 50, range.results.length)} of {range.results.length} shown)</button>}
              <p className="section-footer">
                {cal
                  ? 'Working record: enter readings to compare them with the targets. Review method-specific checks separately.'
                  : 'Change shows the difference from the previous point. Edit a target and leave the field to apply it. Even spacing adjusts later points; percentage mode keeps other targets fixed. Copy and CSV include every point at full precision.'}
              </p>
            </section>
          )
        })}
        </>)}

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
                  <span className="app-symbol" aria-hidden="true">SW</span>
                  <div className="about-logo-text">
                    <div className="about-logo-title">StepWise</div>
                    <div className="about-logo-subtitle">Test-point planning</div>
                  </div>
                </button>
                <div className="about-text">
                  <p>
                    StepWise is a test-point planner for generating
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
                    Use Percentage mode to plan specific fractions of a span, or enter a custom list. The advanced record is a separate working draft; it is not a complete calibration system.
                  </p>
                </div>
                <div className="about-separator" />
                <div className="about-meta">
                  <span className="about-meta-item">JDS-SFW-001</span>
                  <span className="about-meta-item">Rev A</span>
                  <span className="about-meta-item">Test-point planner</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} StepWise</p>
        </footer>
      </div>
    </div>
  )
}

export default App
