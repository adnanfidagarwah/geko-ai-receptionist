/**
 * Theme configuration for the SaaS dashboard
 * Supports both Light & Dark mode
 */

export const colors = {
  primary: {
    DEFAULT: '#3B82F6', // base blue
    dark: '#1D4ED8',
    light: '#60A5FA',
  },
  secondary: {
    DEFAULT: '#64748B',
    dark: '#1E293B',
    light: '#CBD5E1',
  },
  success: {
    DEFAULT: '#22C55E',
    dark: '#15803D',
    light: '#4ADE80',
  },
  warning: {
    DEFAULT: '#F59E0B',
    dark: '#B45309',
    light: '#FCD34D',
  },
  danger: {
    DEFAULT: '#EF4444',
    dark: '#B91C1C',
    light: '#FCA5A5',
  },
  info: {
    DEFAULT: '#06B6D4',
    dark: '#0E7490',
    light: '#67E8F9',
  },
  neutral: {
    lightBg: '#F9FAFB',
    darkBg: '#0F172A',
    lightCard: '#FFFFFF',
    darkCard: '#1E293B',
    lightText: '#111827',
    darkText: '#F9FAFB',
    borderLight: '#E5E7EB',
    borderDark: '#374151',
  },
};

// ✅ Buttons
export const buttonVariants = {
  primary: {
    light: 'bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40',
    dark: 'bg-primary-dark text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary-light/30',
  },
  secondary: {
    light: 'bg-secondary text-white hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary/30',
    dark: 'bg-secondary-dark text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary-light/20',
  },
  success: {
    light: 'bg-success text-white hover:bg-success-dark focus:outline-none focus:ring-2 focus:ring-success/30',
    dark: 'bg-success-dark text-white hover:bg-success focus:outline-none focus:ring-2 focus:ring-success-light/20',
  },
  warning: {
    light: 'bg-warning text-white hover:bg-warning-dark focus:outline-none focus:ring-2 focus:ring-warning/30',
    dark: 'bg-warning-dark text-white hover:bg-warning focus:outline-none focus:ring-2 focus:ring-warning-light/20',
  },
  danger: {
    light: 'bg-danger text-white hover:bg-danger-dark focus:outline-none focus:ring-2 focus:ring-danger/30',
    dark: 'bg-danger-dark text-white hover:bg-danger focus:outline-none focus:ring-2 focus:ring-danger-light/20',
  },
  ghost: {
    light: 'bg-transparent text-primary hover:bg-primary-light/10 focus:outline-none focus:ring-0',
    dark: 'bg-transparent text-primary-light hover:bg-primary-dark/40 focus:outline-none focus:ring-0',
  },
};


// ✅ Button Sizes
export const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
  xl: 'px-6 py-3 text-xl',
};

// ✅ Cards
export const cardVariants = {
  default: {
    light: 'bg-neutral-lightCard border border-neutral-borderLight rounded-lg shadow-sm',
    dark: 'bg-neutral-darkCard border border-neutral-borderDark rounded-lg shadow-md',
  },
  interactive: {
    light: 'bg-neutral-lightCard border border-neutral-borderLight hover:shadow-md transition',
    dark: 'bg-neutral-darkCard border border-neutral-borderDark hover:shadow-lg transition',
  },
};

// ✅ Inputs
export const inputVariants = {
  default: {
    light: 'border border-neutral-borderLight rounded-md focus:ring-primary focus:border-primary bg-white text-neutral-lightText',
    dark: 'border border-neutral-borderDark rounded-md focus:ring-primary-light focus:border-primary-dark bg-neutral-darkCard text-neutral-darkText',
  },
  filled: {
    light: 'bg-neutral-100 border-transparent rounded-md focus:border-primary focus:ring-primary text-neutral-lightText',
    dark: 'bg-neutral-darkCard border-transparent rounded-md focus:border-primary-light focus:ring-primary-dark text-neutral-darkText',
  },
  underlined: {
    light: 'border-b border-neutral-borderLight focus:border-primary focus:ring-0 bg-transparent text-neutral-lightText',
    dark: 'border-b border-neutral-borderDark focus:border-primary-light focus:ring-0 bg-transparent text-neutral-darkText',
  },
};

// ✅ Badges
export const badgeVariants = {
  primary: {
    light: 'bg-primary-light text-primary-dark',
    dark: 'bg-primary-dark text-primary-light',
  },
  secondary: {
    light: 'bg-secondary-light text-secondary-dark',
    dark: 'bg-secondary-dark text-secondary-light',
  },
  success: {
    light: 'bg-success-light text-success-dark',
    dark: 'bg-success-dark text-success-light',
  },
  warning: {
    light: 'bg-warning-light text-warning-dark',
    dark: 'bg-warning-dark text-warning-light',
  },
  danger: {
    light: 'bg-danger-light text-danger-dark',
    dark: 'bg-danger-dark text-danger-light',
  },
  info: {
    light: 'bg-info-light text-info-dark',
    dark: 'bg-info-dark text-info-light',
  },
};

// ✅ Typography
export const typography = {
  h1: 'text-4xl font-bold font-heading',
  h2: 'text-3xl font-bold font-heading',
  h3: 'text-2xl font-bold font-heading',
  h4: 'text-xl font-bold font-heading',
  h5: 'text-lg font-bold font-heading',
  h6: 'text-base font-bold font-heading',
  body1: 'text-base font-normal',
  body2: 'text-sm font-normal',
  caption: 'text-xs font-normal',
  overline: 'text-xs font-medium uppercase tracking-wider',
};

// ✅ Theme Object
export const theme = {
  colors,
  buttonVariants,
  buttonSizes,
  cardVariants,
  inputVariants,
  badgeVariants,
  typography,
};

export default theme;
