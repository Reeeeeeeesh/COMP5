import React from 'react';
import { CalculatorProvider } from '../../contexts/CalculatorContext';
import { CalculatorHeader, InputPanel, ResultsPanel, AdvancedOptionsPanel } from './index';

interface CalculatorContainerProps {
  className?: string;
}

/**
 * Main container for the calculator that provides the CalculatorContext
 * and renders all calculator components
 */
const CalculatorContainer: React.FC<CalculatorContainerProps> = ({ className = '' }) => {
  // Format current date for print footer
  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <CalculatorProvider>
      <div className={`container mx-auto p-3 sm:p-5 md:p-6 max-w-6xl text-gray-100 ${className}`}>
        {/* Print-specific header (only visible when printing) */}
        <div className="print-header"></div>
        
        {/* Regular header (hidden in print) */}
        <CalculatorHeader className="mb-6 sm:mb-8 print:hidden" />
        
        {/* Responsive grid: single column on mobile, two columns on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-5 sm:mb-6 md:mb-8">
          <InputPanel className="order-1 print:hidden" />
          <ResultsPanel className="order-2 print:col-span-2 print:w-full" />
        </div>
        
        <AdvancedOptionsPanel className="mb-8" />
        
        {/* Footer with version info */}
        <footer className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200 print:hidden">
          <p>Flexible Variable Compensation Calculator v1.0</p>
          <p className="mt-1">© {new Date().getFullYear()} - All rights reserved</p>
        </footer>
        
        {/* Print-specific footer (only visible when printing) */}
        <div className="print-footer" data-print-date={currentDate}></div>
      </div>
    </CalculatorProvider>
  );
};

export default CalculatorContainer;
