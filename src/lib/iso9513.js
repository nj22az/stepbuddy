// ISO 9513 — Extensometer calibration class limits and validation

export const CLASSES = {
  '0.2': { relativeError: 0.2, biasError: 0.6 },   // μm
  '0.5': { relativeError: 0.5, biasError: 1.5 },
  '1':   { relativeError: 1.0, biasError: 3.0 },
  '2':   { relativeError: 2.0, biasError: 6.0 },
}

export const CLASS_IDS = ['0.2', '0.5', '1', '2']

// Generate calibration points evenly spaced within a range
export function generatePoints(start, end, count) {
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    reference: start + i * step,
    measuredAsc: '',
    measuredDesc: '',
  }))
}

// Auto-split ranges per ISO 9513 based on lmax/lmin ratio
export function autoSplitRanges(lmin, lmax, pointsPerRange = 5) {
  const ratio = lmax / lmin
  let ranges

  if (ratio <= 10) {
    ranges = [{ start: lmin, end: lmax }]
  } else if (ratio <= 100) {
    const mid = lmin * 10
    ranges = [
      { start: lmin, end: Math.min(mid, lmax) },
      { start: Math.min(mid, lmax), end: lmax },
    ]
  } else {
    const mid1 = lmin * 10
    const mid2 = lmin * 100
    ranges = [
      { start: lmin, end: Math.min(mid1, lmax) },
      { start: Math.min(mid1, lmax), end: Math.min(mid2, lmax) },
      { start: Math.min(mid2, lmax), end: lmax },
    ]
  }

  return ranges.map((r, i) => ({
    id: i + 1,
    start: r.start,
    end: r.end,
    points: generatePoints(r.start, r.end, pointsPerRange),
  }))
}

// Calculate errors for a single point
export function calcErrors(reference, measured) {
  const bias = measured - reference
  const biasUm = Math.abs(bias) * 1000  // mm → μm
  const relative = reference !== 0 ? Math.abs(bias / reference) * 100 : 0
  return { bias, biasUm, relative }
}

// Classify a single point against ISO 9513 limits
// Uses "whichever is greater" rule — point passes if EITHER criterion is met
export function classifyPoint(relativeError, biasUm, targetClass) {
  const limits = CLASSES[targetClass]
  if (!limits) return 'FAIL'
  return (relativeError <= limits.relativeError || biasUm <= limits.biasError) ? 'PASS' : 'FAIL'
}

// Determine the best achievable class for a set of points
export function determineBestClass(points) {
  for (const classId of CLASS_IDS) {
    const limits = CLASSES[classId]
    const allPass = points.every(p => {
      if (p.measuredAsc === '' && p.measuredDesc === '') return true
      const measured = p.measuredAsc !== '' ? parseFloat(p.measuredAsc) : parseFloat(p.measuredDesc)
      if (isNaN(measured)) return true
      const { relative, biasUm } = calcErrors(p.reference, measured)
      return relative <= limits.relativeError || biasUm <= limits.biasError
    })
    if (allPass) return classId
  }
  return null // Fails all classes
}

// Calculate uncertainty budget
export function calcUncertainty(standardU, repeatability, resolution, k = 2) {
  const combined = Math.sqrt(standardU ** 2 + repeatability ** 2 + resolution ** 2)
  return { combined, expanded: combined * k, k }
}
