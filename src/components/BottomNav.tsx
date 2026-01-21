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
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-[32px] z-50 px-6 py-4 pb-safe">
            <div className="flex justify-center items-center gap-16 max-w-md mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={item.action}
                        className="flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-xl transition-all active:scale-95"
                    >
                        <div
                            className="p-3.5 rounded-full transition-colors shadow-sm"
                            style={{
                                backgroundColor: item.colors.bg,
                                color: item.colors.text
                            }}
                        >
                            <item.icon size={28} style={{ color: item.colors.text }} />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
