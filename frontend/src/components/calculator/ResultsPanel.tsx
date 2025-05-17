import React from 'react';
import { useCalculator } from '../../contexts/CalculatorContext';
import { AlertBanner } from './index';

interface ResultsPanelProps {
  className?: string;
}

/**
 * Panel displaying calculation results and breakdown
 */
const ResultsPanel: React.FC<ResultsPanelProps> = ({ className = '' }) => {
  const { results } = useCalculator();

  return (
    <div className={`bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-md border border-gray-700 transition-all ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-300 border-b border-gray-700 pb-2">Calculation Results</h2>
      
      {/* Final Bonus Section */}
      <div className="mb-6">
        <h3 className="text-md sm:text-lg font-semibold text-blue-300 mb-2">Final Bonus</h3>
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 rounded-lg border border-blue-700 shadow-sm">
          <p className="text-2xl sm:text-3xl font-bold text-blue-200">
            £{results.finalBonus.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </p>
          {results.appliedCap && (
            <p className="text-xs sm:text-sm text-blue-300 mt-1">
              (Capped at {results.appliedCap})
            </p>
          )}
        </div>
      </div>
      
      {/* Policy Breach Alert */}
      {results.policyBreach && (
        <div className="mb-6">
          <AlertBanner
            type="error"
            message="Policy Breach: Bonus exceeds 3x base salary"
            isVisible={results.policyBreach}
          />
        </div>
      )}
      
      {/* Calculation Breakdown */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Calculation Breakdown
        </h3>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3 print:grid-cols-2">
          <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
            <p className="text-xs sm:text-sm text-gray-300">Target Bonus</p>
            <p className="font-semibold">
              £{results.targetBonus?.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
            <p className="text-xs sm:text-sm text-gray-300">Bonus to Salary Ratio</p>
            <p className="font-semibold">{results.bonusToSalaryRatio.toFixed(2)}x</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
            <p className="text-xs sm:text-sm text-gray-300">Investment Component</p>
            <p className="font-semibold">{results.investmentScore?.toFixed(2) || results.investmentComponent.toFixed(2)}</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
            <p className="text-xs sm:text-sm text-gray-300">Qualitative Component</p>
            <p className="font-semibold">{results.qualitativeScore?.toFixed(2) || results.qualitativeComponent.toFixed(2)}</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
            <p className="text-xs sm:text-sm text-gray-300">Pre-RAF Bonus</p>
            <p className="font-semibold">
              £{results.preRafBonus?.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
            <p className="text-xs sm:text-sm text-gray-300">RAF Applied</p>
            <p className="font-semibold">{results.raf?.toFixed(2)}</p>
          </div>
          
          {results.baseSalaryCap && (
            <div className="bg-yellow-900 p-3 rounded hover:bg-yellow-800 transition-colors">
              <p className="text-xs sm:text-sm text-yellow-300">3x Base Salary Cap</p>
              <p className="font-semibold">
                £{results.baseSalaryCap.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
          
          {results.mrtCap && (
            <div className="bg-yellow-900 p-3 rounded hover:bg-yellow-800 transition-colors">
              <p className="text-xs sm:text-sm text-yellow-300">MRT Cap</p>
              <p className="font-semibold">
                £{results.mrtCap.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Formula Display */}
      <div>
        <h3 className="text-sm sm:text-md font-medium text-gray-300 mb-2 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Formula
        </h3>
        <div className="bg-gray-700 p-3 rounded border border-gray-600">
          <p className="text-xs sm:text-sm text-gray-300 overflow-x-auto whitespace-nowrap md:whitespace-normal">
            FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
