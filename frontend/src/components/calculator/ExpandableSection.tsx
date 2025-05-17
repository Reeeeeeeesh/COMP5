import React, { useState } from 'react';

interface ExpandableSectionProps {
  title: string;
  isExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * A section that can be expanded or collapsed
 */
const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  isExpanded: isExpandedProp,
  onToggle,
  children,
  className = '',
}) => {
  // Use internal state if no external control is provided
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  // Determine if component is controlled or uncontrolled
  const isControlled = isExpandedProp !== undefined;
  const isExpanded = isControlled ? isExpandedProp : internalIsExpanded;

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle(!isExpanded);
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  const sectionId = `expandable-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`border border-gray-600 rounded-md overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex justify-between items-center p-4 text-left bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isExpanded}
        aria-controls={sectionId}
      >
        <span className="text-sm font-medium text-blue-300">{title}</span>
        <span className="ml-6 flex-shrink-0">
          {isExpanded ? (
            <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      </button>
      <div
        id={sectionId}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 border-t border-gray-200">{children}</div>
      </div>
    </div>
  );
};

export default ExpandableSection;
