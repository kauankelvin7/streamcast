/**
 * Design System Typography Classes - Dark Premium (Streamcast)
 */
export const typography = {
  display: 'text-5xl font-bold tracking-tight',
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-bold tracking-tight',
  h3: 'text-2xl font-bold',
  h4: 'text-xl font-bold',
  bodyLg: 'text-lg font-normal leading-relaxed',
  body: 'text-base font-normal leading-normal',
  caption: 'text-sm font-medium text-text-secondary',
  overline: 'text-xs font-bold uppercase tracking-widest text-text-muted',
} as const;

export type Typography = typeof typography;

// Tailwind utility classes for easy use in components
export const typoClasses = {
  display: 'text-5xl font-bold tracking-tight',
  h1: 'text-4xl font-bold tracking-tight md:text-5xl',
  h2: 'text-3xl font-bold tracking-tight md:text-4xl',
  h3: 'text-2xl font-bold md:text-3xl',
  h4: 'text-xl font-bold md:text-2xl',
  bodyLg: 'text-lg font-normal leading-relaxed',
  body: 'text-base font-normal leading-normal',
  caption: 'text-sm font-medium text-text-secondary',
  overline: 'text-xs font-bold uppercase tracking-widest text-text-muted',
};
