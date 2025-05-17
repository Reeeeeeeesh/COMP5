import React, { useEffect, useState } from 'react';

interface WeightSliderProps {
  label: string;
  name: string;
  value: number;
  linkedName: string;
  linkedValue: number;
  onChange: (name: string, value: number) => void;
  onLinkedChange: (name: string, value: number) => void;
  tooltip?: string;
  className?: string;
}

/**
 * A slider component for percentage weights that automatically adjusts the linked weight
 * to ensure they sum to 100%
 */
const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  name,
  value,
  linkedName,
  linkedValue,
  onChange,
  onLinkedChange,
  tooltip,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
  };

  const handleSliderChangeComplete = () => {
    // Calculate the linked value to ensure sum is 100
    const newLinkedValue = 100 - localValue;
    
    // Update both values
    onChange(name, localValue);
    onLinkedChange(linkedName, newLinkedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
      setLocalValue(newValue);
      
      // Calculate the linked value to ensure sum is 100
      const newLinkedValue = 100 - newValue;
      
      // Update both values
      onChange(name, newValue);
      onLinkedChange(linkedName, newLinkedValue);
    }
  };

  const id = `weight-slider-${name}`;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-300"
          title={tooltip}
        >
          {label}
          {tooltip && (
            <span className="ml-1 text-blue-300 cursor-help" title={tooltip}>
              ⓘ
            </span>
          )}
        </label>
        <div className="flex items-center">
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            min={0}
            max={100}
            className="w-16 p-1 text-right border border-gray-600 rounded-md bg-gray-800 text-white"
          />
          <span className="ml-1 text-gray-300">%</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={localValue}
        onChange={handleSliderChange}
        onMouseUp={handleSliderChangeComplete}
        onTouchEnd={handleSliderChangeComplete}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default WeightSlider;
