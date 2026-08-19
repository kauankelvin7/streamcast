import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes safely
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show loading spinner
   */
  isLoading?: boolean;
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode;
}

/**
 * Premium Button component for Streamcast
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-primary text-white hover:bg-opacity-90 active:scale-[0.98]',
      secondary: 'border border-border text-text-primary hover:bg-bg-hover active:scale-[0.98]',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover active:scale-[0.98]',
      danger: 'bg-status-error text-white hover:bg-opacity-90 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-sm',
      md: 'px-5 py-2.5 text-base rounded-md',
      lg: 'px-8 py-3.5 text-lg font-bold rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
