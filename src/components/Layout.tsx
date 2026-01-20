
import React from 'react';
import { cn } from '../lib/utils';
import type { BabyProfile } from '../types';
import { Baby, Plus } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    currentBaby?: BabyProfile;
    onEditProfile?: () => void;
    onAddProfile?: () => void;
    headerRight?: React.ReactNode;
}

import { getThemeVariables } from '../lib/theme';

export const Layout: React.FC<LayoutProps> = ({ children, currentBaby, onEditProfile, onAddProfile, headerRight }) => {
    const themeVars = currentBaby ? getThemeVariables(currentBaby.themeColor) : getThemeVariables('orange');

    return (
        <div
            className="h-[100dvh] bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200"
            style={themeVars}
        >
            {/* Header */}
            <header className="bg-white p-4 flex justify-between items-center shadow-sm z-10 sticky top-0 h-16">
                <div className="flex items-center gap-3">
                    {/* Current Baby Name (Click to Edit) */}
                    {currentBaby ? (
                        <div
                            onClick={onEditProfile}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors hover:brightness-95 ring-2 ring-offset-1 ring-transparent hover:ring-[var(--theme-light)]",
                                "bg-[var(--theme-light)] text-[var(--theme-text)]"
                            )}
                        >
                            <Baby size={24} className="text-[var(--theme-text)]" />
                            <span className="font-bold text-[var(--theme-text)]">{currentBaby.name}</span>
                        </div>
                    ) : (
                        <span className="font-bold text-xl text-baby-text">HuguLog</span>
                    )}

                    {/* Add Profile Button */}
                    <button
                        onClick={onAddProfile}
                        className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                        title="赤ちゃんを追加"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                {headerRight}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {children}
            </main>
        </div>
    );
};
