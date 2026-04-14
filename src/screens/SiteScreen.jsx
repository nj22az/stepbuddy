// Step 1 — Site / Customer details. First wizard screen.

export function SiteScreen({ test, patch }) {
  const s = test.site
  const set = (key) => (e) => patch({ site: { ...s, [key]: e.target.value } })
  return (
    <section className="section">
      <h2 className="section-header">Site</h2>
      <div className="card">
        <Row id="site-id" label="Site ID" value={s.siteId}
          onChange={set('siteId')} placeholder="123015-M01" />
        <Row id="site-company" label="Company" value={s.company}
          onChange={set('company')} placeholder="UL International Demko A/S" />
        <Row id="site-address" label="Address" value={s.address} multiline
          onChange={set('address')} placeholder="Borupvang 5A, Ballerup DK-2750, Denmark" />
        <Row id="site-contact" label="Contact" value={s.contact}
          onChange={set('contact')} placeholder="Ole Bager" />
        <Row id="site-email" label="Email" value={s.email}
          onChange={set('email')} placeholder="ole.bager@example.com" type="email" />
      </div>
      <p className="section-footer">Customer site recorded on the calibration certificate.</p>
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
