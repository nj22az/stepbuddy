import { EXAMPLES } from '../sequence'
export function PlannerIntro({ onExample }) {
  return <section className="planner-intro" aria-labelledby="planner-heading">
    <p className="planner-eyebrow">A FIELD ENGINEERING TOOL</p>
    <h1 id="planner-heading">A clear plan.<br />One point at a time.</h1>
    <p className="planner-lead">Turn a measurement range into a practical list of test points. Choose the spacing, set the units, then copy or export your plan.</p>
    <div className="planner-example-strip" aria-label="Example of five points between zero and ten kilonewtons">
      <span>0</span><i /><span>2.5</span><i /><span>5</span><i /><span>7.5</span><i /><span>10 <small>kN</small></span>
    </div>
    <div className="planner-start"><div><h2>Start with a real task</h2><p>Examples add a range. Your existing work is retained.</p></div><span className="planner-saved">Saved in this browser</span></div>
    <div className="planner-examples">{EXAMPLES.map(example => <button key={example.id} type="button" className="planner-example" onClick={() => onExample(example)}><strong>{example.title}<span aria-hidden="true">↗</span></strong><span className="example-detail">{example.detail}</span><span>{example.description}</span></button>)}</div>
    <details className="planner-explainer"><summary>What is StepWise for?</summary><div><p><b>For technicians and engineers:</b> prepare repeatable targets for force, pressure, length or electrical measurements, without rebuilding a spreadsheet.</p><p><b>For teachers and students:</b> make the relationship between a range, percentages and individual test points visible.</p><p><b>The calculation:</b> evenly spaced points use start + i × (end − start) ÷ (points − 1). Five points include both endpoints and create four intervals.</p><p>This is a planning tool. A list of points alone does not establish a complete calibration procedure or a conformity decision.</p></div></details>
  </section>
}
