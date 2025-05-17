import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CalculatorInput, CalculationResult, RafParameters } from '../types/calculator';
import { calculateBonus } from '../utils/calculator/calculationEngine';

interface CalculatorContextType {
  inputs: CalculatorInput;
  results: CalculationResult;
  rafParams: RafParameters | undefined;
  isAdvancedRafEnabled: boolean;
  isMrtEnabled: boolean;
  mrtCapPct: number;
  updateInput: (name: string, value: number) => void;
  updateRafParam: (name: string, value: number) => void;
  toggleAdvancedRaf: () => void;
  toggleMrt: () => void;
  updateMrtCapPct: (value: number) => void;
  recalculate: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

// Default values for calculator inputs
const defaultInputs: CalculatorInput = {
  baseSalary: 100000,
  targetBonusPct: 20,
  investmentWeight: 70,
  qualitativeWeight: 30,
  investmentScoreMultiplier: 1,
  qualScoreMultiplier: 1,
  raf: 1
};

// Default values for RAF parameters
const defaultRafParams: RafParameters = {
  teamRevenueYear1: 1000000,
  teamRevenueYear2: 1100000,
  teamRevenueYear3: 1200000,
  sensitivityFactor: 1.0,
  lowerBound: 0.5,
  upperBound: 1.5
};

// Default MRT cap percentage
const defaultMrtCapPct = 200;

export const CalculatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for calculator inputs
  const [inputs, setInputs] = useState<CalculatorInput>(defaultInputs);
  
  // State for calculation results
  const [results, setResults] = useState<CalculationResult>(() => calculateBonus(defaultInputs));
  
  // State for RAF parameters
  const [rafParams, setRafParams] = useState<RafParameters | undefined>(undefined);
  
  // State for advanced RAF toggle
  const [isAdvancedRafEnabled, setIsAdvancedRafEnabled] = useState(false);
  
  // State for MRT toggle
  const [isMrtEnabled, setIsMrtEnabled] = useState(false);
  
  // State for MRT cap percentage
  const [mrtCapPct, setMrtCapPct] = useState(defaultMrtCapPct);

  // Update a single input value
  const updateInput = useCallback((name: string, value: number) => {
    setInputs(prev => {
      const updated = { ...prev, [name]: value };
      
      // Recalculate results with the updated inputs
      const newResults = calculateBonus(
        updated, 
        isAdvancedRafEnabled ? rafParams : undefined,
        isMrtEnabled,
        mrtCapPct
      );
      setResults(newResults);
      
      return updated;
    });
  }, [isAdvancedRafEnabled, isMrtEnabled, mrtCapPct, rafParams]);

  // Update a single RAF parameter
  const updateRafParam = useCallback((name: string, value: number) => {
    setRafParams(prev => {
      const updated = { ...prev, [name]: value } as RafParameters;
      
      // Only recalculate if advanced RAF is enabled
      if (isAdvancedRafEnabled) {
        const newResults = calculateBonus(inputs, updated, isMrtEnabled, mrtCapPct);
        setResults(newResults);
      }
      
      return updated;
    });
  }, [inputs, isAdvancedRafEnabled, isMrtEnabled, mrtCapPct]);

  // Toggle advanced RAF mode
  const toggleAdvancedRaf = useCallback(() => {
    setIsAdvancedRafEnabled(prev => {
      const newValue = !prev;
      
      // Initialize RAF parameters if enabling advanced mode
      if (newValue && !rafParams) {
        setRafParams(defaultRafParams);
      }
      
      // Recalculate with or without RAF parameters
      const newResults = calculateBonus(
        inputs, 
        newValue ? (rafParams || defaultRafParams) : undefined,
        isMrtEnabled,
        mrtCapPct
      );
      setResults(newResults);
      
      return newValue;
    });
  }, [inputs, isMrtEnabled, mrtCapPct, rafParams]);

  // Toggle MRT mode
  const toggleMrt = useCallback(() => {
    setIsMrtEnabled(prev => {
      const newValue = !prev;
      
      // Recalculate with updated MRT setting
      const newResults = calculateBonus(
        inputs, 
        isAdvancedRafEnabled ? rafParams : undefined,
        newValue,
        mrtCapPct
      );
      setResults(newResults);
      
      return newValue;
    });
  }, [inputs, isAdvancedRafEnabled, mrtCapPct, rafParams]);

  // Update MRT cap percentage
  const updateMrtCapPct = useCallback((value: number) => {
    setMrtCapPct(value);
    
    // Recalculate with updated MRT cap percentage
    const newResults = calculateBonus(
      inputs, 
      isAdvancedRafEnabled ? rafParams : undefined,
      isMrtEnabled,
      value
    );
    setResults(newResults);
  }, [inputs, isAdvancedRafEnabled, isMrtEnabled, rafParams]);

  // Force recalculation of results
  const recalculate = useCallback(() => {
    const newResults = calculateBonus(
      inputs, 
      isAdvancedRafEnabled ? rafParams : undefined,
      isMrtEnabled,
      mrtCapPct
    );
    setResults(newResults);
  }, [inputs, isAdvancedRafEnabled, isMrtEnabled, mrtCapPct, rafParams]);

  // Create context value
  const contextValue: CalculatorContextType = {
    inputs,
    results,
    rafParams,
    isAdvancedRafEnabled,
    isMrtEnabled,
    mrtCapPct,
    updateInput,
    updateRafParam,
    toggleAdvancedRaf,
    toggleMrt,
    updateMrtCapPct,
    recalculate
  };

  return (
    <CalculatorContext.Provider value={contextValue}>
      {children}
    </CalculatorContext.Provider>
  );
};

// Custom hook for using the calculator context
export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
};
