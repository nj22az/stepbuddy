// Pure planning logic; values are computed before display rounding.
export const MAX_POINTS = 1000
const number = (value) => String(value ?? '').trim() === '' ? NaN : Number(value)
export function generateSequence(range) {
  const start = number(range.start), end = number(range.end)
  if (![start, end].every(Number.isFinite)) throw new Error('Enter finite start and end values.')
  if (start === end) throw new Error('Start and end must be different.')
  let fractions
  if (range.mode === 'percentage') {
    const entries = (range.percentList || []).flatMap(v => String(v).split(/[,\s]+/)).filter(v => v.trim() !== '')
    const points = entries.map(Number)
    if (!points.every(Number.isFinite)) throw new Error('Percentage points must contain numbers only.')
    fractions = [...new Set(points)].sort((a, b) => a - b).map(p => p / 100)
    if (fractions.length < 2) throw new Error('Enter at least two distinct percentage points.')
  } else {
    const count = number(range.steps)
    if (!Number.isInteger(count) || count < 2 || count > MAX_POINTS) throw new Error(`Choose a whole number of points from 2 to ${MAX_POINTS}.`)
    fractions = Array.from({ length: count }, (_, i) => i / (count - 1))
  }
  if (fractions.length > MAX_POINTS) throw new Error(`Use no more than ${MAX_POINTS} points per range.`)
  const span = end - start
  let previous
  return fractions.map((fraction, i) => {
    const value = fraction === 0 ? start : fraction === 1 ? end : Number.isFinite(span) ? start + span * fraction : start * (1 - fraction) + end * fraction
    if (!Number.isFinite(value)) throw new Error('This range is too large to calculate. Use smaller values.')
    const result = { number: i + 1, value, stepSize: i ? value - previous : 0, ...(range.mode === 'percentage' ? { percent: fraction * 100 } : {}) }
    if (!Number.isFinite(result.stepSize)) throw new Error('This interval is too large to calculate.')
    previous = value
    return result
  })
}
export function editSequence(points, index, value, end, mode) {
  if (!Number.isFinite(value) || index < 0 || index >= points.length) return points
  const result = points.map(p => ({ ...p }))
  result[index].value = value
  if (mode !== 'percentage' && index < result.length - 1) {
    const remaining = result.length - index - 1
    for (let i = index + 1; i < result.length; i++) {
      const t = (i - index) / remaining
      result[i].value = value * (1 - t) + Number(end) * t
    }
  }
  return result.map((p, i) => ({ ...p, stepSize: i ? p.value - result[i - 1].value : 0 }))
}
export const EXAMPLES = [
  { id: 'force', title: 'Force test points', detail: '0–10 kN · 5 points', description: 'Plan an evenly spaced loading sequence.', start: '0', end: '10', steps: '5', unit: 'kN', mode: 'absolute' },
  { id: 'pressure', title: 'Pressure check', detail: '0–10 bar · 5 points', description: 'Prepare targets for a gauge comparison.', start: '0', end: '10', steps: '5', unit: 'bar', mode: 'absolute' },
  { id: 'signal', title: '4–20 mA signal', detail: '4, 8, 12, 16, 20 mA', description: 'Map five points across a signal span.', start: '4', end: '20', steps: '5', unit: 'mA', mode: 'absolute' },
]
