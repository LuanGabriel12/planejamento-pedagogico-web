import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'rounded-lg font-medium transition-colors duration-150 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[42px]',
    lg: 'px-5 py-3 text-base min-h-[48px]'
  };

  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-sm',
    secondary: 'bg-surface border border-strong text-primary hover:bg-hover shadow-sm',
    success: 'bg-success text-on-success hover:opacity-90 shadow-sm',
    danger: 'bg-danger text-on-danger hover:opacity-90 shadow-sm',
    ghost: 'bg-transparent text-secondary hover:bg-hover hover:text-primary'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Processando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
