// Unit catalog for StepWise.
//
// Groups are dimensionally compatible; conversions within a group are
// always safe. Cross-group conversion is defined only between Force and
// Mass via F = m·g, using a per-range local gravity (default ISO 80000-3
// standard gravity, 9.80665 m/s²).
//
// Linear units share a multiplicative factor to the group's base unit.
// Temperature is non-linear and therefore stores explicit toBase/fromBase
// functions — every unit uses the same functional shape so the converter
// never has to branch on "is this temperature?".

export const STANDARD_GRAVITY = 9.80665 // ISO 80000-3 (m/s²)

export const GRAVITY_PRESETS = {
  standard:  { label: 'Standard g₀ (9.80665)', value: 9.80665 },
  stockholm: { label: 'Stockholm ≈59°N',        value: 9.8182 },
  london:    { label: 'London ≈51°N',           value: 9.8119 },
  zurich:    { label: 'Zürich ≈47°N',           value: 9.8072 },
  equator:   { label: 'Equator 0°',             value: 9.780  },
  poles:     { label: 'Poles 90°',              value: 9.832  },
  custom:    { label: 'Custom',                 value: null   },
}

const linear = (factor) => ({
  toBase:   v => v * factor,
  fromBase: v => v / factor,
})

export const UNIT_GROUPS = {
  dimensionless: {
    label: 'None',
    units: {
      '': { label: '— none —', ...linear(1) },
    },
  },
  force: {
    label: 'Force',
    units: {
      N:   { label: 'N',   ...linear(1) },
      mN:  { label: 'mN',  ...linear(1e-3) },
      kN:  { label: 'kN',  ...linear(1e3) },
      MN:  { label: 'MN',  ...linear(1e6) },
      kgf: { label: 'kgf', ...linear(9.80665) },
      gf:  { label: 'gf',  ...linear(0.00980665) },
      lbf: { label: 'lbf', ...linear(4.4482216152605) },
      ozf: { label: 'ozf', ...linear(0.278013850953781) },
    },
  },
  mass: {
    label: 'Mass',
    units: {
      kg: { label: 'kg', ...linear(1) },
      g:  { label: 'g',  ...linear(1e-3) },
      mg: { label: 'mg', ...linear(1e-6) },
      t:  { label: 't',  ...linear(1e3) },
      lb: { label: 'lb', ...linear(0.45359237) },
      oz: { label: 'oz', ...linear(0.028349523125) },
    },
  },
  pressure: {
    label: 'Pressure',
    units: {
      Pa:   { label: 'Pa',   ...linear(1) },
      hPa:  { label: 'hPa',  ...linear(100) },
      kPa:  { label: 'kPa',  ...linear(1e3) },
      MPa:  { label: 'MPa',  ...linear(1e6) },
      bar:  { label: 'bar',  ...linear(1e5) },
      mbar: { label: 'mbar', ...linear(100) },
      psi:  { label: 'psi',  ...linear(6894.757293168) },
      mmHg: { label: 'mmHg', ...linear(133.322387415) },
      atm:  { label: 'atm',  ...linear(101325) },
    },
  },
  length: {
    label: 'Length',
    units: {
      m:   { label: 'm',  ...linear(1) },
      cm:  { label: 'cm', ...linear(1e-2) },
      mm:  { label: 'mm', ...linear(1e-3) },
      um:  { label: 'µm', ...linear(1e-6) },
      in:  { label: 'in', ...linear(0.0254) },
      mil: { label: 'mil', ...linear(0.0000254) },
      ft:  { label: 'ft', ...linear(0.3048) },
    },
  },
  voltage: {
    label: 'Voltage',
    units: {
      V:  { label: 'V',  ...linear(1) },
      mV: { label: 'mV', ...linear(1e-3) },
      kV: { label: 'kV', ...linear(1e3) },
    },
  },
  current: {
    label: 'Current',
    units: {
      A:  { label: 'A',  ...linear(1) },
      mA: { label: 'mA', ...linear(1e-3) },
      uA: { label: 'µA', ...linear(1e-6) },
    },
  },
  torque: {
    label: 'Torque',
    units: {
      'Nm':    { label: 'N·m',    ...linear(1) },
      'mNm':   { label: 'mN·m',   ...linear(1e-3) },
      'kgfm':  { label: 'kgf·m',  ...linear(9.80665) },
      'lbfft': { label: 'lbf·ft', ...linear(1.3558179483314) },
      'lbfin': { label: 'lbf·in', ...linear(0.112984829027617) },
    },
  },
  temperature: {
    label: 'Temperature',
    units: {
      C: { label: '°C', toBase: v => v + 273.15,              fromBase: v => v - 273.15 },
      F: { label: '°F', toBase: v => (v - 32) * 5 / 9 + 273.15, fromBase: v => (v - 273.15) * 9 / 5 + 32 },
      K: { label: 'K',  toBase: v => v,                       fromBase: v => v },
    },
  },
}

// Ordered list of group ids for rendering <optgroup>s in a predictable order.
export const GROUP_ORDER = [
  'dimensionless', 'force', 'mass', 'pressure', 'length',
  'voltage', 'current', 'torque', 'temperature',
]

export function findGroup(unitId) {
  if (unitId == null) return 'dimensionless'
  for (const id of GROUP_ORDER) {
    if (unitId in UNIT_GROUPS[id].units) return id
  }
  return null
}

export function findUnit(unitId) {
  const groupId = findGroup(unitId)
  return groupId ? UNIT_GROUPS[groupId].units[unitId] : null
}

export function unitLabel(unitId) {
  const u = findUnit(unitId)
  if (!u || u.label === '— none —') return ''
  return u.label
}

// Force ↔ Mass is the only cross-group pair we support; it uses F = m·g.
export function needsGravity(fromId, toId) {
  if (!fromId || !toId) return false
  const fg = findGroup(fromId), tg = findGroup(toId)
  return (fg === 'force' && tg === 'mass') || (fg === 'mass' && tg === 'force')
}

export function canConvert(fromId, toId) {
  if (fromId === '' || toId === '' || fromId == null || toId == null) return false
  if (fromId === toId) return true
  const fg = findGroup(fromId), tg = findGroup(toId)
  if (!fg || !tg || fg === 'dimensionless' || tg === 'dimensionless') return false
  if (fg === tg) return true
  return needsGravity(fromId, toId)
}

export function convert(value, fromId, toId, gravity = STANDARD_GRAVITY) {
  if (!canConvert(fromId, toId)) return null
  if (fromId === toId) return value
  const from = findUnit(fromId)
  const to = findUnit(toId)
  const fg = findGroup(fromId)
  const tg = findGroup(toId)
  let base = from.toBase(value) // N, kg, Pa, m, V, A, N·m, or K
  if (fg !== tg) {
    if (fg === 'force' && tg === 'mass') base = base / gravity
    else if (fg === 'mass' && tg === 'force') base = base * gravity
  }
  return to.fromBase(base)
}

// Secondary-unit options for a given primary: all units in the same group
// (excluding the primary itself), plus the cross-group Force↔Mass counterpart.
export function secondaryOptionsFor(primaryId) {
  if (!primaryId) return []
  const primaryGroup = findGroup(primaryId)
  if (!primaryGroup || primaryGroup === 'dimensionless') return []

  const groupsToList = [primaryGroup]
  if (primaryGroup === 'force') groupsToList.push('mass')
  if (primaryGroup === 'mass')  groupsToList.push('force')

  return groupsToList.map(groupId => ({
    groupId,
    groupLabel: UNIT_GROUPS[groupId].label,
    units: Object.entries(UNIT_GROUPS[groupId].units)
      .filter(([id]) => id !== primaryId && id !== '')
      .map(([id, u]) => ({ id, label: u.label })),
  })).filter(g => g.units.length > 0)
}
