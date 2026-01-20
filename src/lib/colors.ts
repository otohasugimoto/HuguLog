// Consolidated Color Configuration

export const LogColors = {
    // Milk (Feed) - Orange
    milk: {
        bg: '#f9f1e4',        // blue-50
        text: '#e29d0c',      // blue-600
        activeBg: '#fefadbff',  // blue-100
    },
    // Excretion (Pee) - Blue
    pee: {
        bg: '#d4ebe8',        // cyan-50
        text: '#168a8c',      // cyan-600
        activeBg: '#cffafe',  // cyan-100
    },
    // Excretion (Poop) - Green (Adjusted based on standard logging colors, typically brown/orange)
    poop: {
        bg: '#fff7ed',        // orange-50
        text: '#cf723fff',      // orange-600
        activeBg: '#ffedd5',  // orange-100
    },
    // Excretion (Both) - Purple
    both: {
        bg: '#fff7ed',        // purple-50
        text: '#cf723fff',      // purple-600
        activeBg: '#f3e8ff',  // purple-100
    },
    // Sleep - Indigo/Violet
    sleep: {
        bg: '#eedbed',        // indigo-50
        text: '#a255a3',      // indigo-600
        activeBg: '#e0e7ff',  // indigo-100
    },
    // Timeline background stripes
    timeline: {
        oddRowBg: '#f9fcfd', // gray-50 (default) replaced with user choice in 1028
    }
} as const;

// Single Default Theme Definition (User Request)
export const ThemeColors = {
    default: {
        primary: '#4fcde3ff',   // cyan-500
        light: '#e7f7f9',     // cyan-50
        medium: '#e7f7f9',    // cyan-100
        text: '#0891b2',      // cyan-600
        gradientFrom: '#22d3ee', // cyan-400
        gradientTo: '#06b6d4',   // cyan-500
    }
} as const;
