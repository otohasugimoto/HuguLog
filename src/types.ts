export type ActivityType = 'feed' | 'sleep' | 'diaper';

export interface BabyProfile {
    id: string;
    name: string;
    birthDate: string; // ISO string
    themeColor: string; // Color name (e.g., 'cyan', 'pink')
}

export interface LogEntry {
    id: string;
    babyId: string;
    type: ActivityType;
    startTime: string; // ISO string
    endTime?: string; // ISO string, for sleep
    amount?: number; // ml for feed
    note?: string; // feed note or diaper detail (pee/poop)
}

export interface AppSettings {
    showGhost: boolean;
    ghostMode: 'yesterday' | 'average';
}

export type DiaperType = 'pee' | 'poop' | 'both';
