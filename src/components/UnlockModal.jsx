import { useState, useRef, useEffect } from 'react'
import { tryUnlock } from '../auth'

export function UnlockModal({ onClose, onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    const ok = await tryUnlock(password)
    setBusy(false)
    if (ok) onUnlock()
    else { setError('Incorrect password'); setPassword('') }
  }

  return (
    <div className="unlock-overlay" onClick={onClose}>
      <form className="unlock-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="unlock-title">Calibration suite</div>
        <div className="unlock-subtitle">Enter password to unlock</div>
        <input ref={inputRef} type="password" autoComplete="off"
          className="unlock-input" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="unlock-error">{error}</div>}
        <div className="unlock-actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--green" disabled={busy || !password}>
            {busy ? '…' : 'Unlock'}
          </button>
        </div>
      </form>
    </div>
  )
}
