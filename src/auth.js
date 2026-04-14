// Calibration-suite gate.
//
// The calibration suite is hidden by default; only the simple StepWise
// calculator is publicly accessible. To unlock the suite the user must
// supply a password whose SHA-256 hash matches the value baked in at
// build time via the VITE_CAL_HASH environment variable.
//
// The plaintext password is NEVER stored in source. The hash itself
// lives in .env.local (gitignored) and ends up in the production bundle
// only after `npm run build`. To rotate the password, regenerate the
// hash and update .env.local — no source code change needed.
//
// Persistence: once a session unlocks, the boolean flag is written to
// localStorage so a refresh keeps the suite visible. A re-lock action
// clears the flag.

const STORAGE_KEY = 'stepwise.unlocked.v1'

// Runtime hash to compare against. Replaced at build time by Vite.
// Empty in dev → no gate, suite always visible (developer convenience).
export const CAL_HASH = (import.meta.env.VITE_CAL_HASH || '').trim().toLowerCase()

export function gateActive() {
  return CAL_HASH.length === 64 // valid SHA-256 hex length
}

export async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function tryUnlock(password) {
  if (!gateActive()) return true
  const h = await sha256Hex(password)
  return h === CAL_HASH
}

export function isUnlocked() {
  if (!gateActive()) return true
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function setUnlocked(v) {
  if (typeof localStorage === 'undefined') return
  if (v) localStorage.setItem(STORAGE_KEY, '1')
  else   localStorage.removeItem(STORAGE_KEY)
}
