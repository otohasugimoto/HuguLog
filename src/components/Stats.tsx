import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { LogEntry } from '../types';
import { isSameDay, differenceInMinutes, parseISO, endOfDay } from 'date-fns';
import { LogColors } from '../lib/colors';

interface StatsProps {
    logs: LogEntry[];
    babyId: string;
    date: Date;
}

export const Stats: React.FC<StatsProps> = ({ logs, babyId, date }) => {
    const dayLogs = useMemo(() => {
        return logs.filter(log => log.babyId === babyId && isSameDay(parseISO(log.startTime), date));
    }, [logs, babyId, date]);

    // Sleep Stats
    const sleepStats = useMemo(() => {
        let totalSleepMinutes = 0;
        dayLogs.forEach(log => {
            if (log.type === 'sleep') {
                const start = parseISO(log.startTime);
                const end = log.endTime ? parseISO(log.endTime) : (isSameDay(new Date(), date) ? new Date() : endOfDay(date));
                totalSleepMinutes += differenceInMinutes(end, start);
            }
        });

        // Ensure we don't exceed 24 hours
        totalSleepMinutes = Math.min(totalSleepMinutes, 1440);
        const awakeMinutes = 1440 - totalSleepMinutes;

        return [
            { name: 'ねんね', value: totalSleepMinutes, color: LogColors.sleep.bg },
            { name: '起き', value: awakeMinutes, color: LogColors.pee.bg }, // Using pee bg (light yellow) for awake
        ];
    }, [dayLogs, date]);

    const totalSleepHours = Math.floor(sleepStats[0].value / 60);
    const totalSleepMins = sleepStats[0].value % 60;

    // Feed Stats
    const feedStats = useMemo(() => {
        let count = 0;
        let totalAmount = 0;
        dayLogs.forEach(log => {
            if (log.type === 'feed') {
                count++;
                totalAmount += log.amount || 0;
            }
        });
        return { count, totalAmount };
    }, [dayLogs]);

    // Diaper Stats
    const diaperStats = useMemo(() => {
        let pee = 0;
        let poop = 0;
        dayLogs.forEach(log => {
            if (log.type === 'diaper') {
                const note = log.note ? JSON.parse(log.note) : {};
                if (note.type === 'pee' || note.type === 'both') pee++;
                if (note.type === 'poop' || note.type === 'both') poop++;
            }
        });
        return { pee, poop };
    }, [dayLogs]);



    return (
        <div className="p-4 space-y-6 pb-24">
            <h2 className="text-xl font-bold text-gray-700">本日のまとめ</h2>

            {/* Sleep Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex justify-between" style={{ color: LogColors.sleep.text }}>
                    <span>💤 睡眠時間</span>
                    <span className="text-xl">{totalSleepHours}時間 {totalSleepMins}分</span>
                </h3>
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sleepStats}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {sleepStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 font-bold pointer-events-none">
                        Total<br />24h
                    </div>
                </div>
            </div>

            {/* Feed Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-2 flex justify-between" style={{ color: LogColors.milk.text }}>
                    <span>🍼 授乳</span>
                    <span className="text-xl">{feedStats.totalAmount}ml <span className="text-sm">/ {feedStats.count}回</span></span>
                </h3>
            </div>

            {/* Diaper Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-2" style={{ color: '#F59E0B' }}>🚽 オムツ</h3>
                <div className="flex justify-around text-center">
                    <div>
                        <div className="text-3xl font-bold" style={{ color: LogColors.pee.text }}>{diaperStats.pee}</div>
                        <div className="text-xs text-gray-400">おしっこ</div>
                    </div>
                    <div className="w-px bg-gray-100 mx-2"></div>
                    <div>
                        <div className="text-3xl font-bold" style={{ color: LogColors.poop.text }}>{diaperStats.poop}</div>
                        <div className="text-xs text-gray-400">うんち</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
