import React from 'react';

const Calculator = () => {
  return (
    <div className="calculator">
      <div className="input-groups">
        <div className="input-group">
          <label className="input-label" htmlFor="start">Start Value</label>
          <input
            className="input-field"
            type="number"
            id="start"
            name="start"
            step="any"
            placeholder="Enter start value"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="end">End Value</label>
          <input
            className="input-field"
            type="number"
            id="end"
            name="end"
            step="any"
            placeholder="Enter end value"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="steps">Number of Steps</label>
          <input
            className="input-field"
            type="number"
            id="steps"
            name="steps"
            min="2"
            placeholder="Min. 2 steps"
          />
        </div>
      </div>

      <div className="button-group">
        <button className="button">
          Calculate
        </button>
      </div>
    </div>
  );
};

export default Calculator; 