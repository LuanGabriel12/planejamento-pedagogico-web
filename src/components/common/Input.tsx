import React, { InputHTMLAttributes, useId } from 'react';
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
  maxLength = 500,
  value,
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const feedbackId = `${inputId}-feedback`;

  const borderColor = error
    ? 'border-danger focus:ring-danger'
    : success
      ? 'border-success focus:ring-success'
      : 'border-strong focus:ring-primary focus:border-primary';

  const charCount = String(value ?? '').length;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-1.5 text-primary">
          {label}
          {props.required && (
            <span className="text-danger ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || helperText || showCharCount ? feedbackId : undefined}
          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors bg-surface text-primary placeholder:text-muted ${error || success ? 'pr-10' : ''} ${borderColor} ${className}`}
          maxLength={maxLength}
          value={value}
          {...props}
        />

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            <AlertCircle className="w-4 h-4 text-danger" />
          </div>
        )}

        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
        )}
      </div>

      {error && (
        <p id={feedbackId} role="alert" className="mt-1.5 text-xs text-danger flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {helperText && !error && !showCharCount && (
        <p id={feedbackId} className="mt-1.5 text-xs text-muted">
          {helperText}
        </p>
      )}

      {showCharCount && !error && (
        <p id={feedbackId} className="mt-1.5 text-xs text-muted text-right">
          {charCount}/{maxLength} caracteres
        </p>
      )}
    </div>
  );
};
