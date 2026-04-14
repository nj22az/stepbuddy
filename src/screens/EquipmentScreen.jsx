// Step 2 — Equipment: Machine, Condition, Transducer, Temp standard.
// Mirrors CalproCR Setup2 layout grouped into sub-cards.

import { CONDITION } from '../test'

export function EquipmentScreen({ test, patch }) {
  const m = test.machine, c = test.condition, t = test.transducer, ts = test.tempStandard
  const setM = (k) => (e) => patch({ machine: { ...m, [k]: e.target.value } })
  const setT = (k) => (e) => patch({ transducer: { ...t, [k]: e.target.value } })
  const setTs = (k) => (e) => patch({ tempStandard: { ...ts, [k]: e.target.value } })
  const setC = (k) => (e) => patch({ condition: { ...c, [k]: e.target.value } })

  return (
    <>
      <section className="section">
        <h2 className="section-header">Machine</h2>
        <div className="card">
          <Field id="m-cat" label="Catalog no." value={m.catalogNo} onChange={setM('catalogNo')} placeholder="34TM5" />
          <Field id="m-ser" label="Prod./Serial no." value={m.serialNo} onChange={setM('serialNo')} placeholder="34TM5M2353" />
          <Field id="m-sys" label="System ID" value={m.systemId} onChange={setM('systemId')} />
          <Field id="m-make" label="Make" value={m.make} onChange={setM('make')} placeholder="Instron" />
          <Field id="m-asset" label="Customer asset no." value={m.customerAssetNo} onChange={setM('customerAssetNo')} />
          <Field id="m-elec" label="Electronics" value={m.electronics} onChange={setM('electronics')} placeholder="3400 Instron" />
          <Field id="m-chan" label="Channel" value={m.channel} onChange={setM('channel')} placeholder="1 (Load)" />
          <div className="card-row">
            <label className="card-row-label" htmlFor="m-sw">Software</label>
            <div className="capacity-picker">
              <input id="m-sw" className="input meta-input" type="text"
                value={m.software} onChange={setM('software')} placeholder="Bluehill Universal" />
              <input className="input capacity-unit-input" type="text" placeholder="ver."
                aria-label="Software version" value={m.softwareVersion} onChange={setM('softwareVersion')} />
            </div>
          </div>
          <div className="card-row">
            <label className="card-row-label" htmlFor="m-type">Type</label>
            <select id="m-type" className="input input--select meta-input"
              value={m.type} onChange={setM('type')}>
              <option>Electro-Mechanical</option>
              <option>Hydraulic</option>
              <option>Servo-Hydraulic</option>
              <option>Pneumatic</option>
              <option>Other</option>
            </select>
          </div>
          <Field id="m-cal" label="Cal. no." value={m.calNo} onChange={setM('calNo')} placeholder="4.47" />
          <Field id="m-year" label="Year of mfg" value={m.year} onChange={setM('year')} placeholder="2021" type="number" />
          <div className="card-row">
            <label className="card-row-label">Hydraulics for force?</label>
            <div className="kgf-mode-toggle">
              <button type="button"
                className={`kgf-mode-btn${!m.hydraulics ? ' kgf-mode-btn--active' : ''}`}
                onClick={() => patch({ machine: { ...m, hydraulics: false } })}>No</button>
              <button type="button"
                className={`kgf-mode-btn${m.hydraulics ? ' kgf-mode-btn--active' : ''}`}
                onClick={() => patch({ machine: { ...m, hydraulics: true } })}>Yes</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-header">Condition of system</h2>
        <div className="card">
          <SelectRow id="c-vis"  label="Visual"     value={c.visual}     onChange={setC('visual')}     opts={CONDITION} />
          <SelectRow id="c-stru" label="Structural" value={c.structural} onChange={setC('structural')} opts={CONDITION} />
          <SelectRow id="c-drv"  label="Drive"      value={c.drive}      onChange={setC('drive')}      opts={CONDITION} />
        </div>
      </section>

      <section className="section">
        <h2 className="section-header">Transducer</h2>
        <div className="card">
          <Field id="t-cat" label="Catalog no." value={t.catalogNo} onChange={setT('catalogNo')} placeholder="2530-10N" />
          <Field id="t-ser" label="Prod./Serial no." value={t.serialNo} onChange={setT('serialNo')} placeholder="2530-10N/157566" />
          <Field id="t-make" label="Make" value={t.make} onChange={setT('make')} placeholder="Instron" />
          <Field id="t-asset" label="Customer asset no." value={t.customerAssetNo} onChange={setT('customerAssetNo')} />
          <div className="card-row">
            <label className="card-row-label" htmlFor="t-cap">Capacity</label>
            <div className="capacity-picker">
              <input id="t-cap" className="input capacity-input" type="text" inputMode="decimal"
                placeholder="10" value={t.capacity} onChange={setT('capacity')} />
              <input className="input capacity-unit-input" type="text" placeholder="N"
                aria-label="Capacity unit" value={t.capacityUnit} onChange={setT('capacityUnit')} />
            </div>
          </div>
          <div className="card-row">
            <label className="card-row-label" htmlFor="t-type">Type</label>
            <select id="t-type" className="input input--select meta-input"
              value={t.type} onChange={setT('type')}>
              <option>Tension</option>
              <option>Compression</option>
              <option>Tension-Compression</option>
            </select>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-header">Temperature standard</h2>
        <div className="card">
          <Field id="ts-name" label="Standard" value={ts.name} onChange={setTs('name')} placeholder="Extech 445580 (°C)" />
          <Field id="ts-ser" label="Serial no." value={ts.serialNo} onChange={setTs('serialNo')} placeholder="1109590" />
        </div>
      </section>
    </>
  )
}

function Field({ id, label, value, onChange, placeholder, type }) {
  return (
    <div className="card-row">
      <label className="card-row-label" htmlFor={id}>{label}</label>
      <input id={id} className="input meta-input" type={type || 'text'}
        value={value} placeholder={placeholder || ''} onChange={onChange} />
    </div>
  )
}

function SelectRow({ id, label, value, onChange, opts }) {
  return (
    <div className="card-row">
      <label className="card-row-label" htmlFor={id}>{label}</label>
      <select id={id} className="input input--select meta-input" value={value} onChange={onChange}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
