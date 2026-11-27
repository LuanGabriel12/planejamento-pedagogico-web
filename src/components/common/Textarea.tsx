import React, { TextareaHTMLAttributes, useId } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  showCharCount?: boolean;
  maxChars?: number;
  minChars?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  success,
  showCharCount = false,
  maxChars = 5000,
  minChars,
  className = '',
  value = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const feedbackId = `${textareaId}-feedback`;

  const texto = String(value);
  const charCount = texto.length;
  const trimmedCount = texto.trim().length;

  const borderColor = error
    ? 'border-danger focus:ring-danger'
    : success
      ? 'border-success focus:ring-success'
      : 'border-strong focus:ring-primary focus:border-primary';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium mb-1.5 text-primary">
          {label}
          {props.required && (
            <span className="text-danger ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <textarea
        id={textareaId}
        aria-invalid={Boolean(error)}
        aria-describedby={error || success || showCharCount ? feedbackId : undefined}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-y bg-surface text-primary placeholder:text-muted ${borderColor} ${className}`}
        value={value}
        maxLength={maxChars}
        {...props}
      />

      <div id={feedbackId} className="flex items-center justify-between gap-2 mt-1.5">
        {error ? (
          <p role="alert" className="text-xs text-danger flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : success ? (
          <p className="text-xs text-success flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Campo válido</span>
          </p>
        ) : (
          <span />
        )}

        {showCharCount && (
          <span
            className={`text-xs ${
              minChars && trimmedCount < minChars ? 'text-warning font-medium' : 'text-muted'
            }`}
          >
            {charCount}
            {maxChars ? `/${maxChars}` : ''}
            {minChars && trimmedCount < minChars ? ` (mínimo: ${minChars})` : ''}
          </span>
        )}
      </div>
    </div>
  );
};
