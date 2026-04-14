// CalibrationTest document — the central data structure persisted to
// localStorage. Mirrors the structure of CalproCR / Instron Calibration
// Suite: site → equipment → standard → ranges → verification → notes.
// The ranges array stays compatible with the existing range shape used
// throughout App.jsx so the migration is additive.

export const STEPS = [
  { id: 'site',      label: 'Site',      n: 1 },
  { id: 'equipment', label: 'Equipment', n: 2 },
  { id: 'standard',  label: 'Standard',  n: 3 },
  { id: 'ranges',    label: 'Ranges',    n: 4 },
  { id: 'verify',    label: 'Verify',    n: 5 },
  { id: 'notes',     label: 'Notes',     n: 6 },
  { id: 'preview',   label: 'Preview',   n: 7 },
]

export const STANDARDS = {
  'iso-7500-1': { label: 'ISO 7500-1 (Force testing machines)', classes: ['0.5', '1', '2', '3'] },
  'iso-9513':   { label: 'ISO 9513 (Extensometers)',             classes: ['0.5', '1', '2'] },
  'iso-376':    { label: 'ISO 376 (Force-proving instruments)',  classes: ['00', '0.5', '1', '2'] },
  'astm-e4':    { label: 'ASTM E4 (Force machine verification)', classes: ['Class A', 'Class B'] },
}

export const MODES = ['Tension', 'Compression', 'Tension-Compression']
export const CONDITION = ['Good', 'Fair', 'Poor']
export const ACCREDITATION_BODIES = ['—', 'NVLAP', 'A2LA', 'UKAS', 'COFRAC', 'DAkkS', 'ENAC', 'SWEDAC', 'DANAK', 'FINAS', 'NorAS']
export const LETTERHEADS = ['EU', 'US', 'UK', 'Custom']
export const LANGUAGES = ['English', 'Svenska', 'Deutsch', 'Français', 'Español', '日本語']

export function defaultTest() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    activeStep: 'site',
    site: { siteId: '', company: '', address: '', contact: '', email: '' },
    machine: {
      catalogNo: '', serialNo: '', systemId: '', make: '', customerAssetNo: '',
      electronics: '', channel: '', software: '', softwareVersion: '',
      type: 'Electro-Mechanical', year: '', hydraulics: false, calNo: '',
    },
    condition: { visual: 'Good', structural: 'Good', drive: 'Good' },
    transducer: {
      catalogNo: '', serialNo: '', make: '', customerAssetNo: '',
      capacity: '', capacityUnit: 'N', type: 'Tension-Compression',
    },
    tempStandard: { name: '', serialNo: '' },
    standard: {
      id: 'iso-7500-1',
      accuracyClass: '1',
      mode: 'Tension-Compression',
      reversibility: false,
      runs: 3,
    },
    notes: {
      certNo: generateCertNo(),
      refCertNo: '', poNo: '', serviceOrderNo: '',
      newInstallation: false,
      startDate: today, dueDate: '',
      accreditationBody: '—', letterhead: 'EU', language: 'English',
      freeText: '',
    },
  }
}

export function generateCertNo() {
  // Format: E + YY + MMDD + 6-digit random — matches Instron's E25004… style
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 1e6)).padStart(6, '0')
  return `E${yy}${mm}${dd}${rand}`
}

// ISO 7500-1 maximum allowed errors per accuracy class (% of indicated load).
// Used to colour-code rows and produce overall pass/fail.
export const ISO_7500_TOLERANCES = {
  '0.5': { errMax: 0.5, repeatMax: 0.5, resolutionMax: 0.25, zeroMax: 0.05 },
  '1':   { errMax: 1.0, repeatMax: 1.0, resolutionMax: 0.5,  zeroMax: 0.1  },
  '2':   { errMax: 2.0, repeatMax: 2.0, resolutionMax: 1.0,  zeroMax: 0.2  },
  '3':   { errMax: 3.0, repeatMax: 3.0, resolutionMax: 1.5,  zeroMax: 0.3  },
}

export function tolerancesFor(test) {
  if (test.standard.id === 'iso-7500-1') {
    return ISO_7500_TOLERANCES[test.standard.accuracyClass] || ISO_7500_TOLERANCES['1']
  }
  // Default permissive band for other standards until per-standard tables added.
  return { errMax: 1.0, repeatMax: 1.0, resolutionMax: 0.5, zeroMax: 0.1 }
}

// Classify an error percentage into ok / warn / bad given tolerance.
export function classifyError(errorPct, tolerance) {
  if (errorPct == null || !Number.isFinite(errorPct)) return ''
  const a = Math.abs(errorPct)
  if (a <= tolerance * 0.6) return 'ok'
  if (a <= tolerance)        return 'warn'
  return 'bad'
}

// Repeat error % across a set of run readings: (max − min) / mean × 100
export function repeatError(runs) {
  const valid = runs.map(parseFloat).filter(Number.isFinite)
  if (valid.length < 2) return null
  const max = Math.max(...valid), min = Math.min(...valid)
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length
  if (mean === 0) return null
  return ((max - min) / Math.abs(mean)) * 100
}

// Mean indicated value across runs
export function meanIndicated(runs) {
  const valid = runs.map(parseFloat).filter(Number.isFinite)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// localStorage persistence for the whole test document.
const STORAGE_KEY = 'stepwise.test.v2'

export function loadTest() {
  if (typeof localStorage === 'undefined') return defaultTest()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultTest()
    const parsed = JSON.parse(raw)
    return mergeDeep(defaultTest(), parsed)
  } catch { return defaultTest() }
}

export function saveTest(test) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(test)) } catch (e) { void e }
}

function mergeDeep(target, source) {
  if (typeof target !== 'object' || target == null) return source
  if (typeof source !== 'object' || source == null) return target
  const out = Array.isArray(target) ? [...target] : { ...target }
  for (const k of Object.keys(source)) {
    if (k in target && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      out[k] = mergeDeep(target[k], source[k])
    } else {
      out[k] = source[k]
    }
  }
  return out
}

// Wizard step completion heuristics — used by the nav to show ✓ marks
export function stepStatus(test, ranges, stepId) {
  switch (stepId) {
    case 'site':
      return test.site.company.trim() !== '' ? 'complete' : 'pending'
    case 'equipment':
      return (test.machine.serialNo.trim() !== '' && test.transducer.capacity.trim() !== '')
        ? 'complete' : 'pending'
    case 'standard':
      return test.standard.id ? 'complete' : 'pending'
    case 'ranges':
      return ranges.length > 0 && ranges[0].start !== '' && ranges[0].end !== ''
        ? 'complete' : 'pending'
    case 'verify': {
      const anyIndicated = ranges.some(r => r.results.some(s => {
        const v = s.indicated ?? (s.runs && s.runs.find(x => x))
        return v != null && String(v).trim() !== ''
      }))
      return anyIndicated ? 'complete' : 'pending'
    }
    case 'notes':
      return test.notes.certNo.trim() !== '' ? 'complete' : 'pending'
    case 'preview':
      return 'pending'
    default:
      return 'pending'
  }
}
