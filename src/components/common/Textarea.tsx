import React, { TextareaHTMLAttributes } from 'react';
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
  maxChars = 5000, // Limite padrão de 5000 caracteres
  minChars,
  className = '',
  value = '',
  ...props
}) => {
  const charCount = String(value).length;
  
  const borderColor = error
    ? 'border-danger focus:ring-danger'
    : success
    ? 'border-success focus:ring-success'
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
        <textarea
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all resize-vertical bg-surface text-primary placeholder:text-muted shadow-md ${borderColor} ${className}`}
          value={value}
          maxLength={maxChars}
          {...props}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2">
        {error ? (
          <p className="text-sm text-danger flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        ) : success ? (
          <p className="text-sm text-success flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Válido!
          </p>
        ) : (
          <span />
        )}
        
        {showCharCount && (
          <span className={`text-sm ${
            charCount < (minChars || 0) 
              ? 'text-danger' 
              : 'text-muted'
          }`}>
            {charCount}
            {maxChars && `/${maxChars}`}
            {minChars && charCount < minChars && ` (mínimo: ${minChars})`}
          </span>
        )}
      </div>
    </div>
  );
};
