import React, { useState, useEffect } from 'react';
import type { LogEntry, DiaperType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';
import { Check, Droplet } from 'lucide-react';
import { PoopIcon } from '../PoopIcon';
import { getThemeClasses, getThemeColor } from '../../lib/theme';
import { LogColors } from '../../lib/colors';

interface DiaperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: LogEntry) => void;
    onDelete?: (logId: string) => void;
    babyId: string;
    initialData?: LogEntry | null;
    themeColor?: string;
}

import { Trash2 } from 'lucide-react';

export const DiaperModal: React.FC<DiaperModalProps> = ({ isOpen, onClose, onSave, onDelete, babyId, initialData, themeColor = 'orange' }) => {
    const [selectedType, setSelectedType] = useState<DiaperType>('pee');
    const [date, setDate] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');

    const themeClasses = getThemeClasses(getThemeColor(themeColor));

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const d = new Date(initialData.startTime);
                setDate(d.toLocaleDateString('en-CA'));
                setStartTime(d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                if (initialData.note) {
                    try {
                        const parsed = JSON.parse(initialData.note);
                        setSelectedType(parsed.type || 'pee');
                    } catch (e) { /* ignore */ }
                }
            } else {
                const now = new Date();
                setDate(now.toLocaleDateString('en-CA'));
                setStartTime(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                setSelectedType('pee');
            }
        }
    }, [isOpen, initialData]);

    const handleDelete = () => {
        if (initialData && onDelete) {
            if (window.confirm('このログを削除しますか？')) {
                onDelete(initialData.id);
                onClose();
            }
        }
    };

    const handleSave = () => {
        const dateTime = new Date(`${date}T${startTime}`);

        const newLog: LogEntry = {
            id: initialData ? initialData.id : uuidv4(),
            babyId,
            type: 'diaper',
            startTime: dateTime.toISOString(),
            note: JSON.stringify({ type: selectedType }),
        };

        onSave(newLog);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:p-0">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-700">おむつ記録</h2>
                    {initialData && onDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Size Selector */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setSelectedType('pee')}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                selectedType === 'pee' ? "shadow-md" : "border-gray-100 bg-white text-gray-400 hover:bg-gray-50"
                            )}
                            style={selectedType === 'pee' ? {
                                backgroundColor: LogColors.pee.bg,
                                color: LogColors.pee.text,
                                borderColor: LogColors.pee.text
                            } : undefined}
                        >
                            <Droplet size={32} style={selectedType === 'pee' ? { color: LogColors.pee.text, fill: LogColors.pee.text } : {}} />
                            <span className="font-bold">おしっこ</span>
                        </button>
                        <button
                            onClick={() => setSelectedType('poop')}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                selectedType === 'poop' ? "shadow-md" : "border-gray-100 bg-white text-gray-400 hover:bg-gray-50"
                            )}
                            style={selectedType === 'poop' ? {
                                backgroundColor: LogColors.poop.bg,
                                color: LogColors.poop.text,
                                borderColor: LogColors.poop.text
                            } : undefined}
                        >
                            <PoopIcon size={32} style={selectedType === 'poop' ? { color: LogColors.poop.text } : {}} />
                            <span className="font-bold">うんち</span>
                        </button>
                        <button
                            onClick={() => setSelectedType('both')}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                selectedType === 'both' ? "shadow-md" : "border-gray-100 bg-white text-gray-400 hover:bg-gray-50"
                            )}
                            style={selectedType === 'both' ? {
                                backgroundColor: LogColors.both.bg,
                                color: LogColors.both.text,
                                borderColor: LogColors.both.text
                            } : undefined}
                        >
                            <div className="flex -space-x-2">
                                <Droplet size={24} style={{ color: LogColors.pee.text, fill: LogColors.pee.text }} />
                                <PoopIcon size={24} style={{ color: LogColors.poop.text }} />
                            </div>
                            <span className="font-bold">両方</span>
                        </button>
                    </div>

                    {/* Date & Time Input */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">日付</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full text-center font-bold p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">時間</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full text-center text-3xl font-bold p-3 bg-gray-50 rounded-xl border-transparent focus:border-yellow-300 focus:bg-white focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSave}
                            className={cn(
                                "flex-1 py-3 text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r",
                                themeClasses.saveBtn
                            )}
                        >
                            <Check />
                            記録する
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
