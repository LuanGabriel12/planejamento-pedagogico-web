import React, { InputHTMLAttributes } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  showCharCount?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  showCharCount = false,
  className = '',
  maxLength = 500, // Limite padrão de 500 caracteres
  value,
  ...props
}) => {
  const borderColor = error
    ? 'border-danger focus:ring-danger'
    : success
    ? 'border-success focus:ring-success'
    : 'border-base focus:ring-primary focus:border-primary';

  const charCount = String(value || '').length;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2 text-primary">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all bg-surface text-primary placeholder:text-muted shadow-md ${borderColor} ${className}`}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-danger" />
          </div>
        )}
        
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-danger flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      
      {helperText && !error && !showCharCount && (
        <p className="mt-2 text-sm text-muted">
          {helperText}
        </p>
      )}

      {showCharCount && !error && (
        <p className="mt-2 text-sm text-muted text-right">
          {charCount}/{maxLength} caracteres
        </p>
      )}
    </div>
  );
};
