import React from 'react';
import { useCalculator } from '../../contexts/CalculatorContext';
import { ExpandableSection, ToggleButton, NumericInput } from './index';

interface AdvancedOptionsPanelProps {
  className?: string;
}

/**
 * Panel containing advanced calculator options like RAF calculation and MRT settings
 */
const AdvancedOptionsPanel: React.FC<AdvancedOptionsPanelProps> = ({ className = '' }) => {
  const { 
    isAdvancedRafEnabled, 
    toggleAdvancedRaf, 
    rafParams, 
    updateRafParam,
    isMrtEnabled,
    toggleMrt,
    mrtCapPct,
    updateMrtCapPct
  } = useCalculator();

  // Handler for RAF parameter changes
  const handleRafParamChange = (name: string, value: number) => {
    updateRafParam(name, value);
  };

  // Handler for MRT cap percentage change
  const handleMrtCapChange = (_name: string, value: number) => {
    updateMrtCapPct(value);
  };

  return (
    <ExpandableSection title="Advanced Options" className={className}>
      <div className="space-y-6">
        {/* MRT Settings */}
        <div className="bg-gray-800 p-3 sm:p-4 rounded-md shadow-sm border border-gray-700">
          <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-3 flex items-center">
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Material Risk Taker (MRT) Settings
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center mb-4">
            <ToggleButton
              label="Enable MRT Cap"
              isActive={isMrtEnabled}
              onChange={toggleMrt}
              tooltip="Apply Material Risk Taker bonus cap"
              className="mb-2 sm:mb-0 sm:mr-4"
            />
            
            <p className="text-xs sm:text-sm text-gray-300">
              Applies additional cap for Material Risk Takers
            </p>
          </div>
          
          {isMrtEnabled && (
            <div className="mt-2 p-3 bg-gray-700 rounded-md border-l-2 border-purple-500">
              <NumericInput
                label="MRT Cap Percentage (%)"
                name="mrtCapPct"
                value={mrtCapPct}
                onChange={handleMrtCapChange}
                min={100}
                max={500}
                step={10}
                suffix="%"
                tooltip="Cap as a percentage of base salary (typically 200%)"
              />
            </div>
          )}
        </div>
        
        {/* RAF Calculator */}
        <div className="bg-gray-800 p-3 sm:p-4 rounded-md shadow-sm border border-gray-700">
          <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-3 flex items-center">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            Revenue Adjustment Factor (RAF) Calculator
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center mb-4">
            <ToggleButton
              label="Calculate RAF from Team Revenue"
              isActive={isAdvancedRafEnabled}
              onChange={toggleAdvancedRaf}
              tooltip="Calculate Revenue Adjustment Factor based on team revenue instead of using a fixed value"
              className="mb-2 sm:mb-0 sm:mr-4"
            />
            
            <p className="text-xs sm:text-sm text-gray-300">
              Automatically calculates RAF based on team revenue
            </p>
          </div>
          
          {isAdvancedRafEnabled && rafParams && (
            <div className="border border-gray-600 rounded-md p-3 sm:p-4 bg-gray-700 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <NumericInput
                  label="Team Revenue Year 1 (£)"
                  name="teamRevenueYear1"
                  value={rafParams.teamRevenueYear1}
                  onChange={handleRafParamChange}
                  min={0}
                  step={100000}
                  prefix="£"
                  tooltip="Team revenue for the first year"
                />
                
                <NumericInput
                  label="Team Revenue Year 2 (£)"
                  name="teamRevenueYear2"
                  value={rafParams.teamRevenueYear2}
                  onChange={handleRafParamChange}
                  min={0}
                  step={100000}
                  prefix="£"
                  tooltip="Team revenue for the second year"
                />
                
                <NumericInput
                  label="Team Revenue Year 3 (£)"
                  name="teamRevenueYear3"
                  value={rafParams.teamRevenueYear3}
                  onChange={handleRafParamChange}
                  min={0}
                  step={100000}
                  prefix="£"
                  tooltip="Team revenue for the third year"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <NumericInput
                  label="Sensitivity Factor"
                  name="sensitivityFactor"
                  value={rafParams.sensitivityFactor}
                  onChange={handleRafParamChange}
                  min={0}
                  max={5}
                  step={0.1}
                  tooltip="Controls how strongly revenue affects RAF (higher = more sensitive)"
                />
                
                <NumericInput
                  label="Lower Bound"
                  name="lowerBound"
                  value={rafParams.lowerBound}
                  onChange={handleRafParamChange}
                  min={0}
                  max={1}
                  step={0.05}
                  tooltip="Minimum possible RAF value"
                />
                
                <NumericInput
                  label="Upper Bound"
                  name="upperBound"
                  value={rafParams.upperBound}
                  onChange={handleRafParamChange}
                  min={1}
                  max={3}
                  step={0.05}
                  tooltip="Maximum possible RAF value"
                />
              </div>
              
              <p className="text-xs text-gray-400 mt-4 italic">
                RAF is calculated based on a 3-year rolling average of team revenue, with sensitivity and bounds applied.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Print button */}
      <div className="mt-5 sm:mt-6 text-center">
        <button 
          onClick={() => window.print()} 
          className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-md text-blue-200 bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors print:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Calculator
        </button>
      </div>
    </ExpandableSection>
  );
};

export default AdvancedOptionsPanel;
