/**
 * Design System Tokens - Dark Premium (Streamcast)
 */
export const tokens = {
  colors: {
    background: {
      main: '#0F0F0F',
      card: '#1A1A1A',
      hover: '#252525',
    },
    brand: {
      primary: '#00A8E1', // Azul Prime-like
      secondary: '#F5C518', // Amarelo destaque
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      muted: '#666666',
    },
    border: '#2A2A2A',
    status: {
      success: '#1DB954',
      error: '#E53E3E',
      warning: '#F6AD55',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    full: '9999px',
  },
} as const;

export type Tokens = typeof tokens;
