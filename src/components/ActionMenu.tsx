import React, { useState } from 'react';
import { Plus, X, Moon, Milk } from 'lucide-react';
import { DiaperIcon } from './DiaperIcon'; // Assuming this exists or using Lucide one if I changed it.
// Step 752 log says "ActionMenu.tsx: actions array... updated to use Lucide icons (DiaperIcon, Moon, Milk)". 
// Warning: DiaperIcon might be a custom component or imported from lucide-react?
// Step 752 snippet says: "import { DiaperIcon } from './DiaperIcon';" NO, it says "icon: <DiaperIcon size={24} />".
// Wait, Lucide doesn't have DiaperIcon. It has Baby, Droplet, etc.
// Step 752 snippet shows `import { DiaperIcon } from './DiaperIcon'`.
// Ah, `ls` showed `src/components/DiaperIcon.tsx`. So I should import that.
// But wait, `ls` in Step 945 shows `DiaperIcon.tsx`. Okay.

import { cn } from '../lib/utils';
import { getThemeClasses, getThemeColor } from '../lib/theme';

interface ActionMenuProps {
    onPressFeed: () => void;
    onPressSleep: () => void;
    onPressDiaper: () => void;
    themeColor?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onPressFeed, onPressSleep, onPressDiaper, themeColor = 'orange' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const themeClasses = getThemeClasses(getThemeColor(themeColor));

    const toggleMenu = () => setIsOpen(!isOpen);

    const actions = [
        { label: 'おむつ', icon: <DiaperIcon size={24} />, onClick: onPressDiaper, color: 'bg-cyan-50 text-cyan-600 border border-cyan-100' },
        { label: 'ねんね', icon: <Moon size={24} />, onClick: onPressSleep, color: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
        { label: 'ミルク', icon: <Milk size={24} />, onClick: onPressFeed, color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Actions */}
            <div className={cn(
                "flex flex-col items-end gap-3 transition-all duration-300 pointer-events-auto",
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
            )}>
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            action.onClick();
                            setIsOpen(false);
                        }}
                        className={cn("flex items-center gap-3 pr-4 pl-3 py-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 bg-white")}
                    >
                        <div className={cn("p-2 rounded-full", action.color)}>
                            {action.icon}
                        </div>
                        <span className="font-bold text-gray-700">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Main FAB */}
            <button
                onClick={toggleMenu}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95 pointer-events-auto bg-gradient-to-br",
                    themeClasses.fabGradient,
                    themeClasses.fabShadow,
                    isOpen && "rotate-45"
                )}
            >
                {isOpen ? <X size={28} /> : <Plus size={28} />}
            </button>
        </div>
    );
};
