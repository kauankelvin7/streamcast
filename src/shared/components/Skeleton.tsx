import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton
   */
  width?: string | number;
  /**
   * Height of the skeleton
   */
  height?: string | number;
  /**
   * Whether to round the skeleton (true = fully rounded, false = sm rounded)
   * @default false
   */
  rounded?: boolean;
}

/**
 * Premium Skeleton component for Streamcast
 * Pulse animation with dark background #252525
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = false,
  className,
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-hover',
        rounded ? 'rounded-full' : 'rounded-sm',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';
