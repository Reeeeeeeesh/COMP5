import React from 'react';

interface CalculatorHeaderProps {
  className?: string;
}

/**
 * Header component for the calculator with responsive design
 */
const CalculatorHeader: React.FC<CalculatorHeaderProps> = ({ className = '' }) => {
  return (
    <header className={`text-center ${className}`}>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-300 leading-tight">
        Flexible Variable Compensation Calculator
      </h1>
      <p className="text-sm sm:text-base text-gray-300 mt-2 max-w-2xl mx-auto">
        Calculate variable compensation based on performance metrics and adjustments
      </p>
      <div className="hidden sm:block mt-4 border-b border-gray-600 w-1/4 mx-auto"></div>
    </header>
  );
};

export default CalculatorHeader;
