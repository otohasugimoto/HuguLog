
import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks, parseISO, getHours, getMinutes, differenceInMinutes, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { LogEntry } from '../types';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Moon, Milk, Droplet } from 'lucide-react';
import { PoopIcon } from './PoopIcon';
import { getThemeClasses, getThemeColor } from '../lib/theme';
import { LogColors } from '../lib/colors';

interface TimelineProps {
    logs: LogEntry[];
    babyId: string;
    showGhost: boolean;
    feedingInterval?: number; // hours
    onLogClick: (log: LogEntry) => void;
    themeColor?: string;
}

interface GhostLog {
    id: string;
    timeMinutes: number; // 0-1440
}

export const Timeline: React.FC<TimelineProps> = ({ logs, babyId, showGhost, feedingInterval = 3.0, onLogClick, themeColor = 'orange' }) => {
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
                const totalHeight = 960; // 24 * 40px
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

    // Helper: Narrow View Layout (Dot shifting)
    const calculateNarrowOffsets = (items: LogEntry[]) => {
        // Only shift non-sleep items (dots)
        const dots = items.filter(i => i.type !== 'sleep').sort((a, b) => {
            const aStart = parseISO(a.startTime);
            const bStart = parseISO(b.startTime);
            return aStart.getTime() - bStart.getTime();
        });

        const offsets = new Map<string, number>();
        const placed: { min: number, lane: number }[] = [];

        dots.forEach(item => {
            const d = parseISO(item.startTime);
            const mins = getHours(d) * 60 + getMinutes(d);

            let lane = 0;
            while (true) {
                // Check collision: within 60 mins (approx 40px height)
                const collision = placed.some(p => p.lane === lane && Math.abs(p.min - mins) < 60);
                if (!collision) break;
                lane++;
            }

            placed.push({ min: mins, lane });
            offsets.set(item.id, lane);
        });

        return offsets;
    };

    // Helper: Layout Calculation
    const calculateLayout = (items: LogEntry[], columnDate: Date) => {
        const dayStart = startOfDay(columnDate);
        const dayEnd = endOfDay(columnDate);

        // 1. Process all items to calculate start/end mins
        const processedItems = items.map(log => {
            const logStart = parseISO(log.startTime);
            // Fix: For non-sleep logs, endTime is irrelevant/same as start. Only sleep defaults to NOW if active.
            let logEnd = log.endTime ? parseISO(log.endTime) : (log.type === 'sleep' ? new Date() : logStart);

            let startMins = 0;
            if (isAfter(logStart, dayStart)) {
                startMins = differenceInMinutes(logStart, dayStart);
            }

            let endMins = 1440;
            if (isBefore(logEnd, dayEnd)) {
                endMins = differenceInMinutes(logEnd, dayStart);
            }

            startMins = Math.max(0, startMins);
            endMins = Math.min(1440, Math.max(startMins + 15, endMins));

            return {
                ...log,
                startMins,
                endMins,
                width: 100,
                left: 0,
                zIndex: log.type === 'sleep' ? 1 : 10, // Default internal z preference
                labelOffsetPercent: 50 // Default center
            };
        });

        // 2. Separate Sleep vs Others
        const sleepItems = processedItems.filter(i => i.type === 'sleep');
        const otherItems = processedItems.filter(i => i.type !== 'sleep');

        // 3. Configure Sleep Items (Background) & Calc Label Position
        sleepItems.forEach(sleep => {
            sleep.width = 100;
            sleep.left = 0;

            // Smart Label Positioning
            // Find non-sleep items that overlap with this sleep item
            const overlaps = otherItems.filter(other =>
                other.startMins >= sleep.startMins && other.startMins <= sleep.endMins
            ).sort((a, b) => a.startMins - b.startMins);

            if (overlaps.length > 0) {
                // Find largest gap
                // Simplified "blocked" radius for other items (approx 24mins = 16px up/down)
                const blockedRadius = 24;

                let gaps: { start: number, end: number, size: number }[] = [];
                let cursor = sleep.startMins;

                overlaps.forEach(item => {
                    // Gap from cursor to item top
                    const itemTop = Math.max(sleep.startMins, item.startMins - blockedRadius);
                    if (itemTop > cursor) {
                        gaps.push({ start: cursor, end: itemTop, size: itemTop - cursor });
                    }
                    // Move cursor to item bottom
                    cursor = Math.max(cursor, Math.min(sleep.endMins, item.startMins + blockedRadius));
                });

                // Final gap
                if (cursor < sleep.endMins) {
                    gaps.push({ start: cursor, end: sleep.endMins, size: sleep.endMins - cursor });
                }

                if (gaps.length > 0) {
                    // Find largest
                    const maxGap = gaps.reduce((prev, current) => (prev.size > current.size) ? prev : current);
                    // Center in gap
                    const gapCenter = maxGap.start + (maxGap.size / 2);
                    // Convert to percentage relative to sleep height using integer math where possible
                    const height = sleep.endMins - sleep.startMins;
                    if (height > 0) {
                        sleep.labelOffsetPercent = ((gapCenter - sleep.startMins) / height) * 100;
                    }
                }
            }
        });

        // 4. Cluster Other Items (Foreground) & Apply Column Packing
        const clusters: typeof otherItems[] = [];
        let currentCluster: typeof otherItems = [];

        // 4a. Create Connect Groups
        otherItems.sort((a, b) => a.startMins - b.startMins).forEach(item => {
            if (currentCluster.length === 0) {
                currentCluster.push(item);
            } else {
                const clusterEnd = Math.max(...currentCluster.map(i => i.endMins));
                if (item.startMins >= clusterEnd) {
                    clusters.push(currentCluster);
                    currentCluster = [item];
                } else {
                    currentCluster.push(item);
                }
            }
        });
        if (currentCluster.length > 0) clusters.push(currentCluster);

        // 4b. Apply Column Packing per Cluster
        clusters.forEach(cluster => {
            cluster.sort((a, b) => {
                if (a.startMins !== b.startMins) return a.startMins - b.startMins;
                return (b.endMins - b.startMins) - (a.endMins - a.startMins);
            });

            const columns: number[] = [];

            cluster.forEach(item => {
                let colIndex = -1;
                for (let i = 0; i < columns.length; i++) {
                    const overlap = Math.max(0, columns[i] - item.startMins);
                    const tolerance = (item.endMins - item.startMins) * 0.25;
                    if (overlap <= tolerance) {
                        colIndex = i;
                        break;
                    }
                }
                if (colIndex === -1) {
                    colIndex = columns.length;
                    columns.push(item.endMins);
                } else {
                    columns[colIndex] = Math.max(columns[colIndex], item.endMins);
                }
                item.left = colIndex;
            });

            const maxColumns = columns.length;
            cluster.forEach(item => {
                item.width = 100 / maxColumns;
                item.left = (100 / maxColumns) * item.left;
            });
        });

        // 5. Combine and Return
        return [...sleepItems, ...otherItems];
    };

    // Ghost Calculation
    const getGhostsForDay = (date: Date): GhostLog[] => {
        if (!showGhost) return [];

        // 1. Find last milk log
        const lastFeedLog = logs
            .filter(l => l.babyId === babyId && l.type === 'feed')
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

        if (!lastFeedLog) return [];

        // 2. Calculate next feed time
        // feedingInterval is in hours
        const lastFeedVal = parseISO(lastFeedLog.startTime);
        const nextFeedVal = new Date(lastFeedVal.getTime() + feedingInterval * 60 * 60 * 1000);

        // 3. Condition:
        // - Is the next feed time on the date we are checking?
        if (!isSameDay(nextFeedVal, date)) {
            return [];
        }

        const now = new Date();
        // - Is it in the future compared to now?
        if (isBefore(nextFeedVal, now)) {
            return []; // Don't show past predictions
        }

        const minutes = getHours(nextFeedVal) * 60 + getMinutes(nextFeedVal);

        return [{ id: 'ghost-next-feed', timeMinutes: minutes }];
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
                <div className="flex w-full relative min-h-[960px]">
                    {/* Note: min-h-[960px] ensures scroll is possible, columns stretch to fit */}

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

                            if (l.type === 'sleep') {
                                // For sleep, keep overlap logic
                                const e = l.endTime ? parseISO(l.endTime) : new Date();
                                return s < dayEnd && e > dayStart;
                            } else {
                                // For feed/diaper (point events), strictly check day
                                // Note: we should use user's local day logic, isSameDay handles this if s and date are correct.
                                return isSameDay(s, date);
                            }
                        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                        const layoutLogs = calculateLayout(dayRawLogs, date);
                        const narrowOffsets = !isSelected ? calculateNarrowOffsets(layoutLogs) : new Map();

                        // Ghosts (Only for selected)
                        const ghosts = isSelected ? getGhostsForDay(date) : [];

                        return (
                            <div
                                key={date.toISOString()}
                                className={cn(
                                    "flex flex-col h-[960px] transition-all duration-300 ease-in-out relative border-r border-transparent", // border-transparent to maintain layout structure
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
                                                borderColor: '#FF3B30'
                                            }}
                                        />
                                    )}

                                    {/* Ghosts (Selected only) */}
                                    {ghosts.map(ghost => {
                                        const top = (ghost.timeMinutes / 1440) * 100;
                                        // Calculate HH:mm from minutes
                                        const h = Math.floor(ghost.timeMinutes / 60);
                                        const m = ghost.timeMinutes % 60;
                                        const timeStr = `${h}:${m.toString().padStart(2, '0')}`;

                                        return (
                                            <div key={ghost.id} className="absolute left-[3rem] right-4 flex items-center justify-start opacity-100 pointer-events-none" style={{ top: `${top}%`, transform: 'translateY(-50%)' }}>
                                                <div className="log-capsule flex items-center px-3 py-1.5 h-8 rounded-[10px] transition-colors border-2 border-dotted"
                                                    style={{
                                                        backgroundColor: 'transparent',
                                                        borderColor: LogColors.milk.text,
                                                    }}
                                                >
                                                    <span className="font-bold text-sm" style={{ color: LogColors.milk.text }}>{timeStr}頃</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Real Logs */}
                                    {layoutLogs.map(log => {
                                        const top = (log.startMins / 1440) * 100;
                                        // Fix: Allow height calculation for sleep even if not selected, for the narrow view bar
                                        const height = log.type === 'sleep'
                                            ? Math.max(log.endMins - log.startMins, 20) / 14.4
                                            : 0;

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

                                        // Duration Calculation for Sleep
                                        let durationStr = "ねんね";
                                        if (log.type === 'sleep') {
                                            const diffMins = log.endMins - log.startMins;
                                            const h = Math.floor(diffMins / 60);
                                            const m = diffMins % 60;
                                            if (h > 0) durationStr = `${h}h${m > 0 ? ` ${m}m` : ''}`;
                                            else durationStr = `${m}m`;
                                        }

                                        const narrowOffset = narrowOffsets.get(log.id) || 0;
                                        // Shift 8px sideways per overlap level
                                        // If not sleep, we shift. Sleep stays center? Or sleep also shifts if logic applies?
                                        // Our calculateNarrowOffsets ONLY returns for non-sleep. So sleep offset is 0.
                                        const narrowShift = narrowOffset * 8;

                                        return (
                                            <div
                                                key={log.id}
                                                onClick={(e) => { e.stopPropagation(); onLogClick(log); }}
                                                className={cn(
                                                    "absolute transition-all duration-300 group cursor-pointer",
                                                    /* Dynamic Z-Index handled via style, simplified class here */
                                                    isSelected ? "scale-100" : "scale-100 origin-center hover:brightness-95"
                                                )}
                                                style={{
                                                    top: `${top}%`,
                                                    // Use calculated height for sleep regardless of selection state
                                                    height: (log.type === 'sleep') ? `${height}%` : 'auto',
                                                    left: isSelected ? `calc(3rem + ${log.left}%)` : '50%',
                                                    width: isSelected ? `calc((100% - 3.5rem) * ${log.width / 100})` : 'auto',
                                                    transform: isSelected
                                                        ? (log.type === 'sleep' ? 'none' : 'translateY(-50%)')
                                                        : (log.type === 'sleep' ? 'translateX(-50%)' : `translateX(calc(-50% + ${narrowShift}px)) translateY(-50%)`),
                                                    minHeight: (log.type === 'sleep') ? '20px' : '0',
                                                    zIndex: isSelected ? (log.type === 'sleep' ? 5 : 20) : (log.type === 'sleep' ? 0 : 10)
                                                }}
                                            >
                                                {/* Render Content based on Mode */}
                                                {isSelected ? (
                                                    // WIDE VIEW RENDERING with Capsule Buttons
                                                    log.type === 'sleep' ? (
                                                        <div
                                                            className="log-capsule w-full h-full rounded-[10px] shadow-sm transition-colors border-2 border-white relative"
                                                            style={getLogStyle()}
                                                        >
                                                            {/* Absolute positioned content to support flexible Y positioning via labelOffsetPercent */}
                                                            <div
                                                                className="flex items-center gap-1 justify-center absolute left-0 right-0"
                                                                style={{
                                                                    top: log.labelOffsetPercent ? `${log.labelOffsetPercent}%` : '50%',
                                                                    transform: 'translateY(-50%)'
                                                                }}
                                                            >
                                                                <Moon size={16} />
                                                                <span className="font-bold text-sm tracking-tight">{durationStr}</span>
                                                            </div>
                                                        </div>
                                                    ) : log.type === 'feed' ? (
                                                        <div className="flex items-start">
                                                            <div className="log-capsule flex items-center gap-2 px-3 py-1.5 h-8 rounded-[10px] shadow-sm transition-colors border-2 border-white" style={getLogStyle()}>
                                                                <Milk size={16} />
                                                                <span className="font-bold text-sm">{log.amount}ml</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Diaper
                                                        <div className="flex items-start">
                                                            <div className="log-capsule flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-colors border-2 border-white" style={getLogStyle()}>
                                                                <Droplet size={16} className={noteData.type === 'poop' ? "hidden" : ""} />
                                                                {(noteData.type === 'poop' || noteData.type === 'both') && <PoopIcon size={16} />}
                                                            </div>
                                                            {/* Diaper doesn't show text now, just icon in circle */}
                                                        </div>
                                                    )
                                                ) : (
                                                    // NARROW VIEW RENDERING (Dots Only)
                                                    <div className={cn("flex justify-center", log.type === 'sleep' ? "h-full" : "")} title={format(parseISO(log.startTime), 'HH:mm')}>
                                                        {log.type === 'sleep' ? (
                                                            <div className="w-2.5 h-full rounded-full ring-2 ring-white" style={{ backgroundColor: LogColors.sleep.text }} />
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
        </div >
    );
};
