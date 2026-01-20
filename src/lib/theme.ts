import { ThemeColors } from './colors';

export type ThemeKey = keyof typeof ThemeColors;

// Helper to get CSS style object for the theme variables
// Ignores the input theme and always returns the default
export const getThemeVariables = (_theme?: string): React.CSSProperties => {
    const colors = ThemeColors.default;

    return {
        '--theme-primary': colors.primary,
        '--theme-light': colors.light,
        '--theme-medium': colors.medium,
        '--theme-text': colors.text,
        '--theme-gradient-from': colors.gradientFrom,
        '--theme-gradient-to': colors.gradientTo,
    } as React.CSSProperties;
};

// Returns the default theme keys for legacy compatibility if needed, 
// though we only have 'default' now.
export const getThemeColor = (_color?: string): ThemeKey => {
    return 'default';
};

// Returns Tailwind classes that consume the CSS variables
export const getThemeClasses = (_color?: string) => {
    return {
        fabGradient: 'from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)]',
        fabShadow: 'shadow-[var(--theme-medium)]',
        tabText: 'text-[var(--theme-text)]',
        saveBtn: 'bg-[var(--theme-primary)] hover:brightness-95 focus:ring-[var(--theme-primary)]',
        dateSelected: 'bg-[var(--theme-medium)] text-[var(--theme-text)]',
        todayText: 'text-[var(--theme-text)]',
        bgStripes: 'bg-[var(--theme-light)]',
    };
};
