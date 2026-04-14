// Unit catalog for StepWise.
//
// Groups are dimensionally compatible; conversions within a group are
// always safe. Cross-group conversion is defined only between Force and
// Mass via F = m·g, using a per-range local gravity (default ISO 80000-3
// standard gravity, 9.80665 m/s²).
//
// Force units split into two kinds:
//   - Pure-force (N, kN, mN, MN) — linear, independent of gravity.
//   - Gravity-dependent (kgf, gf, lbf, ozf) — defined as "force of a
//     reference mass under gravity", so conversions to/from pure force
//     scale with the local gravity the user supplies. This matches what
//     calibration labs actually do when quoting deadweight-produced force
//     at their location, rather than the strict ISO definition that
//     bakes in standard g₀.
//
// Temperature uses explicit toBase/fromBase because it isn't linear;
// every unit uses the same functional shape so the converter never has to
// branch on "is this temperature?".

export const STANDARD_GRAVITY = 9.80665 // ISO 80000-3 (m/s²)

// Gravity presets organised by region for <optgroup> rendering.
// Values are typical local g in m/s² for each city (published surveys or
// IGF model estimates). Users can always switch to Custom.
export const GRAVITY_PRESETS = {
  standard:     { label: 'Standard g₀ (9.80665)', value: 9.80665 },
  equator:      { label: 'Equator 0°',            value: 9.7803  },
  poles:        { label: 'Poles 90°',             value: 9.8322  },

  // Europe
  reykjavik:    { label: 'Reykjavík',              value: 9.8226  },
  oslo:         { label: 'Oslo',                   value: 9.8191  },
  stockholm:    { label: 'Stockholm',              value: 9.8182  },
  helsinki:     { label: 'Helsinki',               value: 9.8189  },
  copenhagen:   { label: 'Copenhagen',             value: 9.8157  },
  moscow:       { label: 'Moscow',                 value: 9.8155  },
  amsterdam:    { label: 'Amsterdam',              value: 9.8133  },
  berlin:       { label: 'Berlin',                 value: 9.8128  },
  warsaw:       { label: 'Warsaw',                 value: 9.8121  },
  london:       { label: 'London',                 value: 9.8119  },
  vienna:       { label: 'Vienna',                 value: 9.8094  },
  paris:        { label: 'Paris',                  value: 9.8094  },
  zurich:       { label: 'Zürich',                 value: 9.8072  },
  rome:         { label: 'Rome',                   value: 9.8034  },
  madrid:       { label: 'Madrid',                 value: 9.7998  },

  // Americas
  toronto:      { label: 'Toronto',                value: 9.8049  },
  chicago:      { label: 'Chicago',                value: 9.8031  },
  new_york:     { label: 'New York',               value: 9.8024  },
  washington:   { label: 'Washington DC',          value: 9.8010  },
  san_francisco:{ label: 'San Francisco',          value: 9.7996  },
  denver:       { label: 'Denver (high alt.)',     value: 9.7962  },
  los_angeles:  { label: 'Los Angeles',            value: 9.7959  },
  houston:      { label: 'Houston',                value: 9.7925  },
  sao_paulo:    { label: 'São Paulo',              value: 9.7866  },
  mexico_city:  { label: 'Mexico City (high alt.)',value: 9.7793  },

  // Asia-Pacific
  seoul:        { label: 'Seoul',                  value: 9.7996  },
  beijing:      { label: 'Beijing',                value: 9.8015  },
  tokyo:        { label: 'Tokyo',                  value: 9.7981  },
  sydney:       { label: 'Sydney',                 value: 9.7963  },
  shanghai:     { label: 'Shanghai',               value: 9.7940  },
  mumbai:       { label: 'Mumbai',                 value: 9.7866  },
  singapore:    { label: 'Singapore',              value: 9.7811  },

  // Africa & Middle East
  cape_town:    { label: 'Cape Town',              value: 9.7963  },
  cairo:        { label: 'Cairo',                  value: 9.7931  },
  dubai:        { label: 'Dubai',                   value: 9.7868  },

  custom:       { label: 'Custom',                 value: null    },
}

// Rendering order: <optgroup>s group the presets above into regions.
export const GRAVITY_PRESET_GROUPS = [
  { label: 'Reference',
    keys: ['standard', 'equator', 'poles'] },
  { label: 'Europe',
    keys: ['reykjavik', 'oslo', 'stockholm', 'helsinki', 'copenhagen', 'moscow',
           'amsterdam', 'berlin', 'warsaw', 'london', 'vienna', 'paris',
           'zurich', 'rome', 'madrid'] },
  { label: 'Americas',
    keys: ['toronto', 'chicago', 'new_york', 'washington', 'san_francisco',
           'denver', 'los_angeles', 'houston', 'sao_paulo', 'mexico_city'] },
  { label: 'Asia-Pacific',
    keys: ['seoul', 'beijing', 'tokyo', 'sydney', 'shanghai', 'mumbai', 'singapore'] },
  { label: 'Africa & Middle East',
    keys: ['cape_town', 'cairo', 'dubai'] },
  { label: 'Custom',
    keys: ['custom'] },
]

// Linear unit: value_base = value × factor. Gravity-independent.
const linear = (factor) => ({
  gravityDep: false,
  toBase:   v      => v * factor,
  fromBase: v      => v / factor,
})

// Gravity-dependent force unit: the unit represents "force of massKg of
// mass under gravity g". base N = v × massKg × g.
const gravityForce = (massKg) => ({
  gravityDep: true,
  massKg,
  toBase:   (v, g = STANDARD_GRAVITY) => v * massKg * g,
  fromBase: (v, g = STANDARD_GRAVITY) => v / (massKg * g),
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
      kgf: { label: 'kgf', ...gravityForce(1) },
      gf:  { label: 'gf',  ...gravityForce(1e-3) },
      lbf: { label: 'lbf', ...gravityForce(0.45359237) },
      ozf: { label: 'ozf', ...gravityForce(0.028349523125) },
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

// True iff the conversion formula actually involves g under the given
// kgfMode. Gravity-dependent force units (kgf / gf / lbf / ozf) behave
// differently under each mode:
//
//   'local' mode (default) — kgf = 1 kg × local g. Matches deadweight
//     calibration practice. Same scaling as kg, so:
//       pure-force ↔ grav-force:     NEEDS g  (e.g. N ↔ kgf)
//       grav-force ↔ mass:           NO       (g cancels, 1 kgf = 1 kg)
//       grav-force ↔ grav-force:     NO       (ratio constant)
//
//   'standard' mode — kgf fixed at 9.80665 N per ISO definition:
//       pure-force ↔ grav-force:     NO       (constant ratio)
//       grav-force ↔ mass:           NEEDS g  (kgf is a fixed N, ÷ local g → kg)
//       grav-force ↔ grav-force:     NO
//
// Cross-group pure-force ↔ mass always needs g (F = m·g).
export function needsGravity(fromId, toId, kgfMode = 'local') {
  if (!fromId || !toId) return false
  const from = findUnit(fromId), to = findUnit(toId)
  if (!from || !to) return false
  const fg = findGroup(fromId), tg = findGroup(toId)
  const pure = (g, u) => g === 'force' && !u.gravityDep
  const grav = (g, u) => g === 'force' && u.gravityDep
  const mass = g => g === 'mass'
  const fP = pure(fg, from), fG = grav(fg, from), fM = mass(fg)
  const tP = pure(tg, to),   tG = grav(tg, to),   tM = mass(tg)

  // Pure-force ↔ mass always needs gravity for F = m·g.
  if ((fP && tM) || (tP && fM)) return true

  if (kgfMode === 'standard') {
    // kgf has a fixed N value, so kgf ↔ mass depends on local g.
    if ((fG && tM) || (tG && fM)) return true
    return false
  }
  // Local mode: pure ↔ grav depends on g; grav ↔ mass cancels.
  if ((fP && tG) || (tP && fG)) return true
  return false
}

export function canConvert(fromId, toId) {
  if (!fromId || !toId) return false
  if (fromId === toId) return true
  const fg = findGroup(fromId), tg = findGroup(toId)
  if (!fg || !tg || fg === 'dimensionless' || tg === 'dimensionless') return false
  if (fg === tg) return true
  return (fg === 'force' && tg === 'mass') || (fg === 'mass' && tg === 'force')
}

export function convert(value, fromId, toId, gravity = STANDARD_GRAVITY, kgfMode = 'local') {
  if (!canConvert(fromId, toId)) return null
  if (fromId === toId) return value
  const from = findUnit(fromId)
  const to = findUnit(toId)
  const fg = findGroup(fromId)
  const tg = findGroup(toId)
  // In 'standard' mode, gravity-dependent force units stay pinned to g₀
  // regardless of the range's local gravity. The cross-group F = m·g step
  // still uses the real local gravity either way.
  const gForForceUnit = kgfMode === 'standard' ? STANDARD_GRAVITY : gravity
  let base = from.toBase(value, gForForceUnit)
  if (fg !== tg) {
    if (fg === 'force' && tg === 'mass') base = base / gravity
    else if (fg === 'mass' && tg === 'force') base = base * gravity
  }
  return to.fromBase(base, gForForceUnit)
}

// Helpers for the UI: is either side a gravity-dependent force unit?
export function hasGravityDependent(fromId, toId) {
  return findUnit(fromId)?.gravityDep === true || findUnit(toId)?.gravityDep === true
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
