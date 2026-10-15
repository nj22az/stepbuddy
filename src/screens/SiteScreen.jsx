// Step 1 — Site / Customer details. First wizard screen.

export function SiteScreen({ test, patch }) {
  const s = test.site
  const set = (key) => (e) => patch({ site: { ...s, [key]: e.target.value } })
  return (
    <section className="section">
      <h2 className="section-header">Site</h2>
      <div className="card">
        <Row id="site-id" label="Site ID" value={s.siteId}
          onChange={set('siteId')} placeholder="SITE-001" />
        <Row id="site-company" label="Company" value={s.company}
          onChange={set('company')} placeholder="Organisation A" />
        <Row id="site-address" label="Address" value={s.address} multiline
          onChange={set('address')} placeholder="Site address (optional)" />
        <Row id="site-contact" label="Contact" value={s.contact}
          onChange={set('contact')} placeholder="Technician A" />
        <Row id="site-email" label="Email" value={s.email}
          onChange={set('email')} placeholder="technician@example.invalid" type="email" />
      </div>
      <p className="section-footer">Use an anonymous site identifier for demonstration records.</p>
    </section>
  )
}

function Row({ id, label, value, onChange, placeholder, type, multiline }) {
  return (
    <div className="card-row card-row--stack">
      <label className="card-row-label" htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} className="input meta-textarea" rows="2"
          value={value} placeholder={placeholder || ''} onChange={onChange} />
      ) : (
        <input id={id} className="input meta-input" type={type || 'text'}
          value={value} placeholder={placeholder || ''} onChange={onChange} />
      )}
    </div>
  )
}
