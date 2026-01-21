import { useState, useEffect } from 'react';
import type { BabyProfile, LogEntry, AppSettings } from '../types';
import { supabase } from '../lib/supabase';

// Helper to sanitize log for DB (convert JSON objects to string if needed, though Supabase handles JSONB, our table has 'text' for note)
// Our SQL schema for 'logs' has: id, family_id, baby_id, type, start_time, end_time, amount, note
// 'babies': id, family_id, name, birth_date, theme_color

export const useStore = (familyId: string | null) => {
    const [profiles, setProfiles] = useState<BabyProfile[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [currentBabyId, setCurrentBabyId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initial settings from local storage (settings are per device usually, or could be per family)
    // For now, keep settings local or sync them? User didn't specify. Let's keep local for simplicity/device preference.
    const [settings, setSettings] = useState<AppSettings>(() => {
        const stored = localStorage.getItem('hugulog_settings');
        return stored ? { ...JSON.parse(stored), feedingInterval: JSON.parse(stored).feedingInterval || 3.0 } : { showGhost: true, feedingInterval: 3.0 };
    });

    // Fetch Data
    useEffect(() => {
        if (!familyId) {
            setProfiles([]);
            setLogs([]);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);

            // Fetch Profiles
            const { data: profilesData } = await supabase
                .from('babies')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: true });

            if (profilesData) {
                const mappedProfiles: BabyProfile[] = profilesData.map(p => ({
                    id: p.id,
                    name: p.name,
                    birthDate: p.birth_date, // SQL is snake_case
                    themeColor: p.theme_color
                }));
                setProfiles(mappedProfiles);

                // Set current baby
                const storedCurrent = localStorage.getItem('hugulog_current_baby');
                if (storedCurrent && mappedProfiles.some(p => p.id === storedCurrent)) {
                    setCurrentBabyId(storedCurrent);
                } else if (mappedProfiles.length > 0) {
                    setCurrentBabyId(mappedProfiles[0].id);
                }
            }

            // Fetch Logs (Last 30 days? Or all? For MVP all is fine, but maybe limit later)
            const { data: logsData } = await supabase
                .from('logs')
                .select('*')
                .eq('family_id', familyId)
                .order('start_time', { ascending: true }); // We sort in app usually, but DB sort is good foundation

            if (logsData) {
                const mappedLogs: LogEntry[] = logsData.map(l => ({
                    id: l.id,
                    babyId: l.baby_id,
                    type: l.type as 'feed' | 'sleep' | 'diaper',
                    startTime: l.start_time,
                    endTime: l.end_time || undefined,
                    amount: l.amount || undefined,
                    note: l.note || undefined,
                }));
                setLogs(mappedLogs);
            }

            setIsLoading(false);
        };

        fetchData();

        // Realtime Subscription
        const channel = supabase.channel('family_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'logs', filter: `family_id=eq.${familyId}` },
                () => {
                    fetchData();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'babies', filter: `family_id=eq.${familyId}` },
                () => { fetchData(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [familyId]);

    // Persistence for local settings
    useEffect(() => {
        localStorage.setItem('hugulog_settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        if (currentBabyId) {
            localStorage.setItem('hugulog_current_baby', currentBabyId);
        }
    }, [currentBabyId]);

    // Mutation Wrappers
    const addProfile = async (profile: BabyProfile) => {
        if (!familyId) return;

        // Optimistic Update
        const newProfiles = [...profiles, profile];
        setProfiles(newProfiles);

        // If this is the first baby, select it automatically
        if (!currentBabyId) {
            setCurrentBabyId(profile.id);
        }

        const { error } = await supabase.from('babies').insert([{
            id: profile.id,
            family_id: familyId,
            name: profile.name,
            birth_date: profile.birthDate || null, // Convert empty string to null
            theme_color: profile.themeColor
        }]);

        if (error) {
            console.error('Error adding profile:', error);
            // Revert on error
            setProfiles(prev => prev.filter(p => p.id !== profile.id));
            if (!currentBabyId) setCurrentBabyId(null);
        }
    };

    const updateProfile = async (profile: BabyProfile) => {
        if (!familyId) return;

        setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));

        await supabase.from('babies').update({
            name: profile.name,
            birth_date: profile.birthDate || null, // Convert empty string to null
            theme_color: profile.themeColor
        }).eq('id', profile.id);
    };

    const setAppSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const addLog = async (log: LogEntry) => {
        if (!familyId) return;

        setLogs(prev => [...prev, log]);

        await supabase.from('logs').insert([{
            id: log.id,
            family_id: familyId,
            baby_id: log.babyId,
            type: log.type,
            start_time: log.startTime,
            end_time: log.endTime,
            amount: log.amount,
            note: log.note
        }]);
    };

    const updateLog = async (log: LogEntry) => {
        if (!familyId) return;

        setLogs(prev => prev.map(l => l.id === log.id ? log : l));

        await supabase.from('logs').update({
            start_time: log.startTime,
            end_time: log.endTime,
            amount: log.amount,
            note: log.note
        }).eq('id', log.id);
    };

    const deleteLog = async (id: string) => {
        if (!familyId) return;

        setLogs(prev => prev.filter(l => l.id !== id));

        await supabase.from('logs').delete().eq('id', id);
    };

    return {
        profiles,
        logs,
        currentBabyId,
        setCurrentBabyId,
        addProfile,
        updateProfile,
        addLog,
        updateLog,
        deleteLog,
        settings,
        setAppSettings,
        isLoading
    };
};
