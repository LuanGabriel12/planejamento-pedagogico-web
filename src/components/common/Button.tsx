import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:scale-[0.98] shadow-md hover:shadow-lg',
    secondary: 'bg-surface border-2 border-strong text-primary hover:bg-hover hover:border-hover active:scale-[0.98] shadow-md',
    success: 'bg-success text-white hover:opacity-95 active:scale-[0.98] shadow-md hover:shadow-lg',
    danger: 'bg-danger text-white hover:opacity-95 active:scale-[0.98] shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-secondary hover:bg-hover hover:text-primary active:scale-[0.98]'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Aguarde...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

