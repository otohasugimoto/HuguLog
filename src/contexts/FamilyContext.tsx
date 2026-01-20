import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FamilyContextType {
    familyId: string | null;
    isLoading: boolean;
    login: (familyCode: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    familyCode: string | null; // Display purposes if needed
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [familyCode, setFamilyCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore session from local storage
        const storedFamilyId = localStorage.getItem('babylog_family_id');
        const storedFamilyCode = localStorage.getItem('babylog_family_code');
        if (storedFamilyId) {
            setFamilyId(storedFamilyId);
            setFamilyCode(storedFamilyCode);
        }
        setIsLoading(false);
    }, []);

    const login = async (code: string) => {
        setIsLoading(true);
        try {
            // Simple check: does this family code exist?
            // "family_code" column in "families" table
            const { data, error } = await supabase
                .from('families')
                .select('id, family_code')
                .eq('family_code', code)
                .single();

            if (error || !data) {
                // If not found, create new family? 
                // Specification didn't explicitly say "Create if not exists", but implied "Shared".
                // If I enter a code that doesn't exist, should I create it?
                // For a "Family ID (Password)" style, usually you create one first.
                // Let's implement: "Try to find. If matches, login. If not found, ask user?"
                // Actually, let's implement auto-creation for simplicity or make it distinct.
                // User said: "Family ID (Password) login logic".
                // Let's TRY to find first. If error is "PGRST116" (JSON object requested, multiple (or no) rows returned), it means not found (if single()).

                // Let's implement: If exact match found -> Login.
                // If not found -> Create new Family with this code?
                // This mimics a "Room" style.

                const { data: newData, error: createError } = await supabase
                    .from('families')
                    .insert([{ family_code: code }])
                    .select()
                    .single();

                if (createError) {
                    // Maybe it existed but we failed to find it? Or duplicate key if timing race?
                    // Or just generic error
                    setIsLoading(false);
                    return { success: false, error: 'ログインに失敗しました。' };
                }

                // Created new family
                setFamilyId(newData.id);
                setFamilyCode(newData.family_code);
                localStorage.setItem('babylog_family_id', newData.id);
                localStorage.setItem('babylog_family_code', newData.family_code);
                setIsLoading(false);
                return { success: true };

            } else {
                // Found existing
                setFamilyId(data.id);
                setFamilyCode(data.family_code);
                localStorage.setItem('babylog_family_id', data.id);
                localStorage.setItem('babylog_family_code', data.family_code);
                setIsLoading(false);
                return { success: true };
            }

        } catch (e) {
            setIsLoading(false);
            return { success: false, error: 'エラーが発生しました。' };
        }
    };

    const logout = () => {
        setFamilyId(null);
        setFamilyCode(null);
        localStorage.removeItem('babylog_family_id');
        localStorage.removeItem('babylog_family_code');
    };

    return (
        <FamilyContext.Provider value={{ familyId, isLoading, login, logout, familyCode }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (!context) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
};
