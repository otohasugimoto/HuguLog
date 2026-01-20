import React, { useState, useEffect } from 'react';
import type { LogEntry } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Play, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getThemeClasses, getThemeColor } from '../../lib/theme';
import { LogColors } from '../../lib/colors';

interface SleepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: LogEntry) => void;
    babyId: string;
    activeSleepLog?: LogEntry | null; // For stopping active sleep
    initialData?: LogEntry | null; // For editing past logs
    themeColor?: string;
}

export const SleepModal: React.FC<SleepModalProps> = ({ isOpen, onClose, onSave, babyId, activeSleepLog, initialData, themeColor = 'orange' }) => {
    // Mode: 'timer' (stopwatch), 'manual' (input), 'edit' (edit existing)
    const [mode, setMode] = useState<'timer' | 'manual'>('timer');

    const themeClasses = getThemeClasses(getThemeColor(themeColor));

    // Manual Input State
    const [date, setDate] = useState<string>('');
    const [startTimeStr, setStartTimeStr] = useState<string>('');
    const [endTimeStr, setEndTimeStr] = useState<string>('');

    // Timer state
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            // Initialize Manual Input
            if (initialData) {
                setMode('manual');
                const start = new Date(initialData.startTime);
                setDate(start.toLocaleDateString('en-CA')); // YYYY-MM-DD format
                setStartTimeStr(start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                if (initialData.endTime) {
                    const end = new Date(initialData.endTime);
                    setEndTimeStr(end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                } else {
                    setEndTimeStr('');
                }
            } else {
                setMode(activeSleepLog ? 'timer' : 'timer'); // Default to timer usually
                setDate(now.toLocaleDateString('en-CA'));
                setStartTimeStr(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                setEndTimeStr(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
            }

            // Timer logic
            if (activeSleepLog && !initialData) {
                const interval = setInterval(() => {
                    const startTime = new Date(activeSleepLog.startTime).getTime();
                    setElapsed(Math.floor((Date.now() - startTime) / 1000));
                }, 1000);
                return () => clearInterval(interval);
            } else {
                setElapsed(0); // Reset elapsed if no active log or if editing
            }
        } else {
            // Reset states when modal closes
            setElapsed(0);
            setDate('');
            setStartTimeStr('');
            setEndTimeStr('');
        }
    }, [isOpen, activeSleepLog, initialData]);

    if (!isOpen) return null;

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartSleep = () => {
        const log: LogEntry = {
            id: uuidv4(),
            babyId,
            type: 'sleep',
            startTime: new Date().toISOString(),
        };
        onSave(log);
        onClose();
    };

    const handleStopSleep = () => {
        if (!activeSleepLog) return;
        const updatedLog = {
            ...activeSleepLog,
            endTime: new Date().toISOString()
        };
        onSave(updatedLog); // Use onSave to update existing log
        onClose();
    };

    const handleManualSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !startTimeStr) return;

        const start = new Date(`${date}T${startTimeStr}`);
        let end: Date | undefined;

        if (endTimeStr) {
            end = new Date(`${date}T${endTimeStr}`);
            // Handle day crossing if end time is earlier than start time (simplified assumption: next day)
            if (end < start) {
                end.setDate(end.getDate() + 1);
            }
        }

        const newLog: LogEntry = {
            id: initialData ? initialData.id : uuidv4(),
            babyId,
            type: 'sleep',
            startTime: start.toISOString(),
            endTime: end ? end.toISOString() : undefined,
        };

        onSave(newLog);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:p-0">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-700">
                        💤 睡眠を記録
                    </h3>

                    <button
                        onClick={() => setMode('timer')}
                        className={cn("px-3 py-1 rounded-md text-sm transition-all", mode === 'timer' ? 'bg-white shadow font-bold' : 'text-gray-500')}
                        style={mode === 'timer' ? { color: LogColors.sleep.text } : undefined}
                    >
                        タイマー
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={cn("px-3 py-1 rounded-md text-sm transition-all", mode === 'manual' ? 'bg-white shadow font-bold' : 'text-gray-500')}
                        style={mode === 'manual' ? { color: LogColors.sleep.text } : undefined}
                    >
                        手入力
                    </button>
                </div>
            </div>

            {mode === 'timer' ? (
                <div className="text-center py-4">
                    {activeSleepLog ? (
                        <div className="space-y-6">
                            <div className="text-5xl font-mono font-medium" style={{ color: LogColors.sleep.text }}>
                                {formatDuration(elapsed)}
                            </div>
                            <p className="text-sm" style={{ color: LogColors.sleep.text }}>でおねんね中...</p>
                            <button
                                onClick={handleStopSleep}
                                className="w-full py-4 bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
                            >
                                <Square size={20} fill="currentColor" />
                                起きた
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-5xl font-mono font-medium text-gray-300">
                                00:00:00
                            </div>
                            <button
                                onClick={handleStartSleep}
                                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-95 transition-colors"
                                style={{ backgroundColor: LogColors.sleep.bg, color: LogColors.sleep.text }}
                            >
                                <Play size={20} fill="currentColor" />
                                おやすみ
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <form onSubmit={handleManualSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">日付</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full text-center font-bold p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">寝た時間</label>
                            <input
                                type="time"
                                required
                                value={startTimeStr}
                                onChange={(e) => setStartTimeStr(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl text-lg font-mono border-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">起きた時間</label>
                            <input
                                type="time"
                                value={endTimeStr}
                                onChange={(e) => setEndTimeStr(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl text-lg font-mono border-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={cn(
                            "w-full py-3 mt-4 font-bold text-white rounded-xl shadow-md active:scale-95 transition-transform bg-gradient-to-r",
                            themeClasses.saveBtn
                        )}
                    >
                        保存
                    </button>
                </form>
            )}

            <button onClick={onClose} className="w-full text-center text-gray-400 mt-6 text-sm hover:bg-gray-50 py-2 rounded-lg">
                閉じる
            </button>
        </div>
    );
};
