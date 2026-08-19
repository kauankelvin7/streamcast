import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge style variant
   * @default 'default'
   */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'rating';
  /**
   * Badge size
   * @default 'md'
   */
  size?: 'sm' | 'md';
  /**
   * Optional icon to display inside the badge
   */
  icon?: React.ReactNode;
}

/**
 * Premium Badge component for Streamcast
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-bg-hover text-text-primary border border-border',
    info: 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20',
    success: 'bg-status-success/10 text-status-success border border-status-success/20',
    warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    danger: 'bg-status-error/10 text-status-error border border-status-error/20',
    rating: 'bg-brand-secondary text-bg-main font-bold border-none',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px] uppercase tracking-wider',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
