# StepWise — test-point planner

StepWise turns a start/end range into target values for a measurement task. It is intended for field service engineers, calibration technicians, laboratory staff, and practical technical teaching.

For example, **0–10 kN with five points** gives **0, 2.5, 5, 7.5, 10 kN**. Both endpoints count, so five points make four intervals. A 4–20 mA example produces 4, 8, 12, 16 and 20 mA.

## Main workflow

1. Open a force, pressure or signal example, or enter your own range.
2. Choose even spacing or custom percentages of the start/end span.
3. Add units and optional conversions; choose display decimals.
4. Generate the points, review them, then copy or export CSV.

Examples retain existing work. Ranges can be named and edited. Changing a planning input clears its old results, so they must be regenerated. Point counts must be whole numbers between 2 and 1,000. Descending ranges are supported. Display rounding does not alter calculated CSV values.

In even-spacing mode, editing a target leaves earlier targets fixed and redistributes the later targets to the original endpoint. In percentage mode, the other targets stay fixed. Interval values record the change from the previous point.

## Advanced working record

The separate advanced workspace retains the existing site, equipment, method, readings and printable record screens. Where configured, its existing password gate still applies. It is a working draft, not a complete accredited calibration or conformity system. Indication-error checks alone do not establish compliance; method-specific procedures, uncertainty and completeness need independent review. Point patterns are planning aids, not assertions that a particular standard has been satisfied.

## Data and appearance

Records remain in the current browser using the existing `stepwise.test.v2` storage key. The redesign preserves that document and existing ranges. Copy/CSV provides portable planning results; no cloud synchronisation is provided.

The interface follows the supplied Note design reference: readable Helvetica-based typography, white/grey surfaces, dark primary actions, mint accents, 44 px touch targets, and semantic dark-mode colours.

## Development

```sh
npm ci
npm test
npm run dev
npm run build
```

Vite publishes under `/stepbuddy/`. GitHub Actions runs tests and builds before updating the `gh-pages` branch. The planner remains the default workspace regardless of whether the advanced record is unlocked.

MIT licence.
