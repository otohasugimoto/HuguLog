
import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks, parseISO, getHours, getMinutes, differenceInMinutes, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { LogEntry } from '../types';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Moon, Milk, Trash2, Droplet } from 'lucide-react';
import { PoopIcon } from './PoopIcon';
import { getThemeClasses, getThemeColor } from '../lib/theme';
import { LogColors } from '../lib/colors';

interface TimelineProps {
    logs: LogEntry[];
    babyId: string;
    onDeleteLog: (id: string) => void;
    showGhost: boolean;
    ghostMode?: 'yesterday' | 'average';
    onLogClick: (log: LogEntry) => void;
    themeColor?: string;
}

interface GhostLog {
    id: string;
    timeMinutes: number; // 0-1440
    amount: number;
}

export const Timeline: React.FC<TimelineProps> = ({ logs, babyId, onDeleteLog, showGhost, ghostMode = 'average', onLogClick, themeColor = 'orange' }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const hasScrolledRef = useRef(false);

    const themeClasses = getThemeClasses(getThemeColor(themeColor));

    // Generate week days
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

    const changeWeek = (direction: 'prev' | 'next') => {
        const newStart = direction === 'prev' ? subWeeks(currentWeekStart, 1) : addWeeks(currentWeekStart, 1);
        setCurrentWeekStart(newStart);
        const dayDiff = Math.floor((selectedDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
        const cleanDiff = Math.max(0, Math.min(6, dayDiff));
        setSelectedDate(addDays(newStart, cleanDiff));
    };

    // Auto-scroll to center current time
    // Auto-scroll to center current time
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollContainerRef.current && !hasScrolledRef.current) {
                const now = new Date();
                const currentMinutes = getHours(now) * 60 + getMinutes(now);
                const totalHeight = 1536; // 24 * 64px
                const containerHeight = scrollContainerRef.current.clientHeight;

                // Retry if height is 0
                if (containerHeight === 0) return;

                const targetScroll = (currentMinutes / 1440) * totalHeight - (containerHeight / 2);

                scrollContainerRef.current.scrollTo({
                    top: Math.max(0, targetScroll),
                    behavior: 'smooth'
                });
                hasScrolledRef.current = true;
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []); // Run once on mount

    // Helper: Layout Calculation
    const calculateLayout = (items: LogEntry[], columnDate: Date) => {
        const dayStart = startOfDay(columnDate);
        const dayEnd = endOfDay(columnDate);

        const layoutItems = items.map(log => {
            const logStart = parseISO(log.startTime);
            let logEnd = log.endTime ? parseISO(log.endTime) : new Date();

            // Calculate start minutes relative to day start
            // If starts before today, it's 0. If after, it's relative mins.
            let startMins = 0;
            if (isAfter(logStart, dayStart)) {
                startMins = differenceInMinutes(logStart, dayStart);
            }

            // Calculate end minutes
            let endMins = 1440; // Default to end of day

            // If log ends on this day (or before end of day), calculate specific end time
            if (isBefore(logEnd, dayEnd)) {
                endMins = differenceInMinutes(logEnd, dayStart);
            }
            // If active (no endTime) and we are looking at a past day, it fills the whole day (conceptually until "now" which is in future) -> 1440
            // If active and we are looking at today, it goes until "now" -> calculated above.
            // If active/future end and we are looking at today, we clamp at 1440 anyway?
            // Wait, differenceInMinutes(future, dayStart) > 1440.

            // Clamp values
            startMins = Math.max(0, startMins);
            endMins = Math.min(1440, Math.max(startMins + 15, endMins)); // Ensure at least 15m duration visually if very short, and clamp to 1440

            return {
                ...log,
                startMins,
                endMins,
                width: 100,
                left: 0
            };
        });

        // Detect overlaps
        const clusters: typeof layoutItems[] = [];
        let currentCluster: typeof layoutItems = [];

        layoutItems.sort((a, b) => a.startMins - b.startMins).forEach(item => {
            if (currentCluster.length === 0) {
                currentCluster.push(item);
            } else {
                const clusterEnd = Math.max(...currentCluster.map(i => i.endMins));
                if (item.startMins < clusterEnd) {
                    currentCluster.push(item);
                } else {
                    clusters.push(currentCluster);
                    currentCluster = [item];
                }
            }
        });
        if (currentCluster.length > 0) clusters.push(currentCluster);

        clusters.forEach(cluster => {
            const count = cluster.length;
            cluster.forEach((item, index) => {
                item.width = 100 / count;
                item.left = (100 / count) * index;
            });
        });

        return layoutItems;
    };

    // Ghost Calculation
    const getGhostsForDay = (date: Date) => {
        if (!showGhost) return [];

        let pastDays: Date[] = [];
        if (ghostMode === 'yesterday') {
            pastDays = [addDays(date, -1)];
        } else {
            // Average of past 3 days
            pastDays = [1, 2, 3].map(d => addDays(date, -d));
        }

        const pastFeedsByIndex: { [key: number]: { times: number[], amounts: number[] } } = {};

        pastDays.forEach(pastDate => {
            const daysLogs = logs
                .filter(l => l.babyId === babyId && l.type === 'feed' && isSameDay(parseISO(l.startTime), pastDate))
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            daysLogs.forEach((log, index) => {
                if (!pastFeedsByIndex[index]) pastFeedsByIndex[index] = { times: [], amounts: [] };
                const d = parseISO(log.startTime);
                const minutes = getHours(d) * 60 + d.getMinutes();
                pastFeedsByIndex[index].times.push(minutes);
                if (log.amount !== undefined && log.amount !== null) {
                    pastFeedsByIndex[index].amounts.push(Number(log.amount));
                }
            });
        });

        const ghosts: GhostLog[] = [];
        Object.entries(pastFeedsByIndex).forEach(([index, data]) => {
            if (data.times.length === 0) return;
            const avgTime = Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length);
            const avgAmount = data.amounts.length > 0 ? Math.round(data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length) : 0;
            ghosts.push({ id: `ghost-${index}`, timeMinutes: avgTime, amount: avgAmount });
        });
        return ghosts;
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            {/* Week Navigation Header (Global) */}
            <div className="flex items-center justify-between p-2 bg-white z-40 shadow-sm border-b cursor-default">
                <button onClick={() => changeWeek('prev')} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                <span className="font-bold text-gray-700">
                    {format(currentWeekStart, 'yyyy年 M月', { locale: ja })}
                </span>
                <button onClick={() => changeWeek('next')} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
            </div>

            {/* Separate Header Row (Fixed) */}
            <div className="flex w-full bg-white z-30 shadow-sm">
                {weekDays.map(date => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    const dailyMilkTotal = logs
                        .filter(l => l.babyId === babyId && l.type === 'feed' && isSameDay(parseISO(l.startTime), date))
                        .reduce((sum, log) => sum + (log.amount || 0), 0);

                    return (
                        <div
                            key={`header-${date.toISOString()}`}
                            className={cn(
                                "flex flex-col items-center justify-center py-2 h-16 transition-all duration-300 ease-in-out cursor-pointer",
                                isSelected ? "flex-[4] bg-white" : "flex-1 bg-white hover:bg-gray-50"
                            )}
                            onClick={() => !isSelected && setSelectedDate(date)}
                        >
                            <div className={cn(
                                "flex flex-col items-center justify-center w-8 h-8 rounded-full transition-all",
                                isSelected ? `${themeClasses.dateSelected} text-gray-700 shadow-sm scale-110` : "text-gray-400"
                            )}>
                                <span className="text-[9px] font-bold leading-none">{format(date, 'E', { locale: ja })}</span>
                                <span className={cn("text-xs font-bold leading-none", isToday && themeClasses.todayText)}>{format(date, 'd')}</span>
                            </div>
                            {dailyMilkTotal > 0 && (
                                <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                                    {dailyMilkTotal}ml
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Scrollable Body Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden relative w-full pb-28"
            >
                <div className="flex w-full relative min-h-[1536px]">
                    {/* Note: min-h-[1536px] ensures scroll is possible, columns stretch to fit */}

                    {weekDays.map(date => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());

                        // Filter & Layout Logs
                        // Include logs that overlap with this day
                        const dayStart = startOfDay(date);
                        const dayEnd = endOfDay(date);

                        const dayRawLogs = logs.filter(l => {
                            if (l.babyId !== babyId) return false;

                            const s = parseISO(l.startTime);
                            const e = l.endTime ? parseISO(l.endTime) : new Date();

                            // Check overlap: Start < DayEnd AND End > DayStart
                            // Note: We use < and > for overlap.
                            return s < dayEnd && e > dayStart;
                        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                        const layoutLogs = calculateLayout(dayRawLogs, date);

                        // Ghosts (Only for selected)
                        const ghosts = isSelected ? getGhostsForDay(date) : [];

                        return (
                            <div
                                key={date.toISOString()}
                                className={cn(
                                    "flex flex-col h-[1536px] transition-all duration-300 ease-in-out relative border-r border-transparent", // border-transparent to maintain layout structure
                                    isSelected ? "flex-[4] bg-white/20" : "flex-1 bg-white/50 hover:bg-gray-50/50 cursor-pointer"
                                )}
                                onClick={() => !isSelected && setSelectedDate(date)}
                            >
                                {/* Column Body Content */}
                                <div className="relative w-full h-full">
                                    {/* Background Zebra Stripes */}
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} className={cn(
                                            "absolute w-full",
                                            i % 2 === 0 ? "bg-white" : ""
                                        )}
                                            style={{
                                                top: `${(i / 24) * 100}%`,
                                                height: '4.16%', // 100/24
                                                backgroundColor: i % 2 !== 0 ? LogColors.timeline.oddRowBg : undefined
                                            }}>
                                            {/* Time Label (Only in selected column) */}
                                            {isSelected && (
                                                <span className="absolute top-1 left-1 text-[10px] text-gray-400 opacity-50 font-medium pointer-events-none">{i}:00</span>
                                            )}
                                        </div>
                                    ))}

                                    {/* Current Time Line (if today & selected) */}
                                    {isToday && isSelected && (
                                        <div
                                            className="absolute w-full border-t-2 z-10 pointer-events-none"
                                            style={{
                                                top: `${((getHours(new Date()) * 60 + new Date().getMinutes()) / 1440) * 100}%`,
                                                borderColor: 'var(--theme-primary)'
                                            }}
                                        >
                                            <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
                                        </div>
                                    )}

                                    {/* Ghosts (Selected only) */}
                                    {ghosts.map(ghost => {
                                        const top = (ghost.timeMinutes / 1440) * 100;
                                        return (
                                            <div key={ghost.id} className="absolute left-[3rem] right-4 flex items-center justify-start opacity-50 pointer-events-none" style={{ top: `${top}%` }}>
                                                <div className="log-capsule flex items-center gap-2 px-3 py-1.5 h-11 rounded-full shadow-sm transition-colors"
                                                    style={{
                                                        backgroundColor: LogColors.milk.text,
                                                        color: '#ffffff',
                                                    }}
                                                >
                                                    <Milk size={16} />
                                                    <span className="font-bold text-sm">{ghost.amount}ml</span>
                                                    <span className="text-[10px] bg-white/20 px-1 rounded ml-1">目安</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Real Logs */}
                                    {layoutLogs.map(log => {
                                        const top = (log.startMins / 1440) * 100;
                                        const height = log.type === 'sleep'
                                            ? Math.max(log.endMins - log.startMins, 20) / 14.4
                                            : 0;

                                        const handleDelete = (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            if (window.confirm('このログを削除しますか？')) onDeleteLog(log.id);
                                        };

                                        const noteData = log.type === 'diaper' ? (JSON.parse(log.note || '{}')) : {};

                                        // Helper to get CSS vars
                                        const getLogStyle = () => {
                                            if (log.type === 'feed') {
                                                return { '--log-bg': LogColors.milk.text, '--log-text': '#ffffff', '--log-active-bg': LogColors.milk.text } as React.CSSProperties;
                                            }
                                            if (log.type === 'sleep') {
                                                return { '--log-bg': LogColors.sleep.text, '--log-text': '#ffffff', '--log-active-bg': LogColors.sleep.text } as React.CSSProperties;
                                            }
                                            if (log.type === 'diaper') {
                                                if (noteData.type === 'pee') return { '--log-bg': LogColors.pee.text, '--log-text': '#ffffff', '--log-active-bg': LogColors.pee.text } as React.CSSProperties;
                                                if (noteData.type === 'poop') return { '--log-bg': LogColors.poop.text, '--log-text': '#ffffff', '--log-active-bg': LogColors.poop.text } as React.CSSProperties;
                                                return { '--log-bg': LogColors.both.text, '--log-text': '#ffffff', '--log-active-bg': LogColors.both.text } as React.CSSProperties;
                                            }
                                            return {};
                                        };

                                        return (
                                            <div
                                                key={log.id}
                                                onClick={(e) => { e.stopPropagation(); onLogClick(log); }}
                                                className={cn(
                                                    "absolute transition-all duration-300 group cursor-pointer",
                                                    isSelected ? "z-20 scale-100" : "z-10 scale-100 origin-center hover:brightness-95"
                                                )}
                                                style={{
                                                    top: `${top}%`,
                                                    height: (isSelected && log.type === 'sleep') ? `${height}%` : 'auto',
                                                    left: isSelected ? `calc(3rem + ${log.left}%)` : '50%',
                                                    width: isSelected ? `calc((100% - 3.5rem) * ${log.width / 100})` : 'auto',
                                                    transform: isSelected ? 'none' : 'translateX(-50%)',
                                                    minHeight: (isSelected && log.type === 'sleep') ? '20px' : '0'
                                                }}
                                            >
                                                {/* Render Content based on Mode */}
                                                {isSelected ? (
                                                    // WIDE VIEW RENDERING with Capsule Buttons
                                                    log.type === 'sleep' ? (
                                                        <div className="log-capsule w-full h-full rounded-2xl shadow-sm flex items-center justify-center p-1 transition-colors" style={getLogStyle()}>
                                                            <div className="flex items-center gap-2">
                                                                <Moon size={16} />
                                                                <span className="font-bold text-sm">ねんね</span>
                                                            </div>
                                                            <button onClick={handleDelete} className="absolute top-1 right-1 p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : log.type === 'feed' ? (
                                                        <div className="flex items-start">
                                                            <div className="log-capsule flex items-center gap-2 px-3 py-1.5 h-11 rounded-full shadow-sm transition-colors" style={getLogStyle()}>
                                                                <Milk size={16} />
                                                                <span className="font-bold text-sm">{log.amount}ml</span>
                                                            </div>
                                                            <button onClick={handleDelete} className="ml-1 mt-3 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // Diaper
                                                        <div className="flex items-start">
                                                            <div className="log-capsule flex items-center gap-2 px-3 py-1.5 h-11 rounded-full shadow-sm transition-colors" style={getLogStyle()}>
                                                                <Droplet size={16} className={noteData.type === 'poop' ? "hidden" : "fill-current"} />
                                                                {(noteData.type === 'poop' || noteData.type === 'both') && <PoopIcon size={16} />}
                                                                <span className="font-bold text-sm">
                                                                    {(noteData.type === 'pee') ? 'おしっこ' :
                                                                        (noteData.type === 'poop') ? 'うんち' : '両方'}
                                                                </span>
                                                            </div>
                                                            <button onClick={handleDelete} className="ml-1 mt-3 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    // NARROW VIEW RENDERING (Dots Only)
                                                    <div className="flex justify-center" title={format(parseISO(log.startTime), 'HH:mm')}>
                                                        {log.type === 'sleep' ? (
                                                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: LogColors.sleep.text }} />
                                                        ) : log.type === 'feed' ? (
                                                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: LogColors.milk.text }} />
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{
                                                                backgroundColor: (noteData.type === 'pee') ? LogColors.pee.text :
                                                                    (noteData.type === 'poop') ? LogColors.poop.text : LogColors.both.text
                                                            }} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
