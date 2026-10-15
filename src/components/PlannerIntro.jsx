import { EXAMPLES } from '../sequence'
export function PlannerIntro({ onExample }) {
  return <section className="planner-intro" aria-labelledby="planner-heading">
    <p className="planner-eyebrow">TEST-POINT PLANNING</p>
    <h1 id="planner-heading">Plan your test points.</h1>
    <p className="planner-lead">Create a list of measurement targets for a test, inspection or lesson.</p>
    <ol className="planner-guide" aria-label="How to use StepWise">
      <li><strong>Set your range</strong><span>Enter the start, end and unit below.</span></li>
      <li><strong>Choose your points</strong><span>Use even spacing or percentages of the span.</span></li>
      <li><strong>Generate and save</strong><span>Review the targets, then copy or export CSV.</span></li>
    </ol>
    <button type="button" className="btn btn--green planner-try" onClick={() => onExample(EXAMPLES[0])}>Try a five-point example</button>
    <p className="planner-example-caption">0, 2.5, 5, 7.5 and 10 kN. Adds an example without replacing your work.</p>
    <details className="planner-explainer"><summary>More examples and guidance</summary><div>
      <div className="planner-examples">{EXAMPLES.map(example => <button key={example.id} type="button" className="planner-example" onClick={() => onExample(example)}><strong>{example.title}</strong><span className="example-detail">{example.detail}</span><span>{example.description}</span></button>)}</div>
      <p><b>Number of points includes both ends.</b> Five points from 0 to 10 give four equal intervals of 2.5.</p>
      <p><b>Percentage of span:</b> 0% means the start and 100% means the end. For a 4–20 mA range, 50% is 12 mA.</p>
      <p><b>Your work is saved in this browser.</b> Use CSV to keep a separate copy or move the targets to a worksheet.</p>
      <p>This tool helps technicians, engineers and teachers plan repeatable targets. A list of points alone does not establish a complete calibration procedure or a conformity decision.</p>
    </div></details>
  </section>
}
