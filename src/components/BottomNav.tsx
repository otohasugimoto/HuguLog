import React from 'react';
import { Milk, Moon, Droplet } from 'lucide-react';
import { LogColors } from '../lib/colors';

interface BottomNavProps {
    onPressFeed: () => void;
    onPressSleep: () => void;
    onPressDiaper: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onPressFeed, onPressSleep, onPressDiaper }) => {

    const navItems = [
        {
            label: 'ミルク',
            icon: Milk,
            action: onPressFeed,
            colors: LogColors.milk
        },
        {
            label: 'おむつ',
            icon: Droplet,
            action: onPressDiaper,
            colors: LogColors.pee // Defaulting to pee (cyan) for generic diaper button
        },
        {
            label: 'ねんね',
            icon: Moon,
            action: onPressSleep,
            colors: LogColors.sleep
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 px-6 py-2 pb-safe">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={item.action}
                        className="flex flex-col items-center justify-center gap-1 w-20 py-2 rounded-xl transition-all active:scale-95 hover:bg-gray-50"
                    >
                        <div
                            className="p-2 rounded-full transition-colors"
                            style={{
                                backgroundColor: item.colors.bg,
                                color: item.colors.text
                            }}
                        >
                            <item.icon size={24} style={{ color: item.colors.text }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
