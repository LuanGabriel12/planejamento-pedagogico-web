import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  const borderColor = error 
    ? 'border-danger' 
    : 'border-base focus:ring-primary focus:border-primary';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2 text-primary">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all appearance-none bg-surface text-primary shadow-md ${borderColor} ${className}`}
          {...props}
        >
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-surface text-primary"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-muted" />
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
};
