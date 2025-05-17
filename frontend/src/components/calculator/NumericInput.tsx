import React from 'react';

interface NumericInputProps {
  label: string;
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * A reusable numeric input component with validation and formatting
 */
const NumericInput: React.FC<NumericInputProps> = ({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  tooltip,
  prefix,
  suffix,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(name, newValue);
    }
  };

  const id = `numeric-input-${name}`;

  return (
    <div className={`mb-4 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-300 mb-1"
        title={tooltip}
      >
        {label}
        {tooltip && (
          <span className="ml-1 text-blue-300 cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          name={name}
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={`w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white ${
            prefix ? 'pl-7' : ''
          } ${suffix ? 'pr-7' : ''}`}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default NumericInput;
