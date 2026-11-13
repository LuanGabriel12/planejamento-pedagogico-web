import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = ''
}) => {
  const variants = {
    success: 'bg-success/15 text-success border-2 border-success/30',
    warning: 'bg-warning/15 text-warning border-2 border-warning/30',
    danger: 'bg-danger/15 text-danger border-2 border-danger/30',
    info: 'bg-info/15 text-info border-2 border-info/30',
    gray: 'bg-elevated text-secondary border-2 border-base'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

