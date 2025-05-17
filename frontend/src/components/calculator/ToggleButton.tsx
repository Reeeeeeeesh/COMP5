import React from 'react';

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onChange: () => void;
  tooltip?: string;
  className?: string;
}

/**
 * A button that toggles between active and inactive states
 */
const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  isActive,
  onChange,
  tooltip,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <button
        type="button"
        onClick={onChange}
        title={tooltip}
        className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isActive
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="mr-2">
          {isActive ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        {label}
      </button>
    </div>
  );
};

export default ToggleButton;
