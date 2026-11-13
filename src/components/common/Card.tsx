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
  const hoverClass = hover ? 'hover:shadow-xl hover:-translate-y-1 hover:border-strong' : '';
  
  return (
    <div
      className={`rounded-xl shadow-md transition-all duration-200 bg-surface border-2 border-base overflow-hidden ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

