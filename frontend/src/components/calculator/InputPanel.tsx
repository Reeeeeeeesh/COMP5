import React from 'react';
import { useCalculator } from '../../contexts/CalculatorContext';
import { NumericInput, WeightSlider } from './index';

interface InputPanelProps {
  className?: string;
}

/**
 * Panel containing all input fields for the calculator
 */
const InputPanel: React.FC<InputPanelProps> = ({ className = '' }) => {
  const { inputs, updateInput } = useCalculator();

  // Handler for numeric input changes
  const handleInputChange = (name: string, value: number) => {
    updateInput(name, value);
  };

  return (
    <div className={`bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-md border border-gray-700 transition-all ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-300 border-b border-gray-700 pb-2">Input Parameters</h2>
      
      {/* Basic Information Section */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <NumericInput
            label="Base Salary (£)"
            name="baseSalary"
            value={inputs.baseSalary}
            onChange={handleInputChange}
            min={0}
            step={1000}
            prefix="£"
            tooltip="Annual base salary in GBP"
          />
          
          <NumericInput
            label="Target Bonus (%)"
            name="targetBonusPct"
            value={inputs.targetBonusPct}
            onChange={handleInputChange}
            min={0}
            max={500}
            step={1}
            suffix="%"
            tooltip="Target bonus as a percentage of base salary"
          />
        </div>
      </div>
      
      {/* Performance Components Section */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Performance Components
        </h3>
        
        <div className="mb-4 bg-gray-700 p-3 rounded-md">
          <p className="text-xs sm:text-sm text-gray-300 mb-2">
            Adjust the relative weights of investment and qualitative components
          </p>
          
          <WeightSlider
            label="Investment Weight"
            name="investmentWeight"
            value={inputs.investmentWeight}
            linkedName="qualitativeWeight"
            linkedValue={inputs.qualitativeWeight}
            onChange={handleInputChange}
            onLinkedChange={handleInputChange}
            tooltip="Weight given to investment performance"
          />
          
          <WeightSlider
            label="Qualitative Weight"
            name="qualitativeWeight"
            value={inputs.qualitativeWeight}
            linkedName="investmentWeight"
            linkedValue={inputs.investmentWeight}
            onChange={handleInputChange}
            onLinkedChange={handleInputChange}
            tooltip="Weight given to qualitative performance"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <NumericInput
            label="Investment Score Multiplier"
            name="investmentScoreMultiplier"
            value={inputs.investmentScoreMultiplier}
            onChange={handleInputChange}
            min={0}
            max={3}
            step={0.1}
            tooltip="Multiplier for investment performance (0-3x)"
          />
          
          <NumericInput
            label="Qualitative Score Multiplier"
            name="qualScoreMultiplier"
            value={inputs.qualScoreMultiplier}
            onChange={handleInputChange}
            min={0}
            max={3}
            step={0.1}
            tooltip="Multiplier for qualitative performance (0-3x)"
          />
        </div>
      </div>
      
      {/* Revenue Adjustment Section */}
      <div>
        <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
          Revenue Adjustment
        </h3>
        
        <NumericInput
          label="Revenue Adjustment Factor (RAF)"
          name="raf"
          value={inputs.raf}
          onChange={handleInputChange}
          min={0}
          max={2}
          step={0.05}
          tooltip="Factor to adjust bonus based on team revenue (typically 0.5-1.5)"
        />
        
        <p className="text-xs text-gray-400 mt-1 italic">
          Enable advanced options below to calculate RAF based on team revenue
        </p>
      </div>
    </div>
  );
};

export default InputPanel;
