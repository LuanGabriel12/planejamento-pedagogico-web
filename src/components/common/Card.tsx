import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  className = '',
  ...props
}) => {
  const hoverClass = hover ? 'hover:shadow-md hover:border-strong transition-all duration-150' : '';

  return (
    <div
      className={`rounded-xl shadow-sm bg-surface border border-base ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
