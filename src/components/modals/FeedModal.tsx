import React, { useState, useEffect } from 'react';
import type { LogEntry } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getThemeClasses, getThemeColor } from '../../lib/theme';
import { cn } from '../../lib/utils';
import { LogColors } from '../../lib/colors';

interface FeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: LogEntry) => void;
    babyId: string;
    initialData?: LogEntry | null;
    themeColor?: string;
}

export const FeedModal: React.FC<FeedModalProps> = ({ isOpen, onClose, onSave, babyId, initialData, themeColor = 'orange' }) => {
    const [amount, setAmount] = useState(120);
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [note, setNote] = useState('');

    const themeClasses = getThemeClasses(getThemeColor(themeColor));

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const d = new Date(initialData.startTime);
                setAmount(initialData.amount || 120);
                setNote(initialData.note || '');
                setDate(d.toLocaleDateString('en-CA')); // YYYY-MM-DD
                setTime(d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
            } else {
                const now = new Date();
                setAmount(120);
                setNote('');
                setDate(now.toLocaleDateString('en-CA'));
                setTime(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dateTime = new Date(`${date}T${time}`);

        const newLog: LogEntry = {
            id: initialData ? initialData.id : uuidv4(),
            babyId,
            type: 'feed',
            startTime: dateTime.toISOString(),
            amount,
            note,
        };

        onSave(newLog);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:p-0">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: LogColors.milk.text }}>
                    🍼 ミルクを記録
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full text-center text-xl font-bold p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">ミルク量: {amount}ml</label>
                        <input
                            type="range"
                            min="0"
                            max="300"
                            step="10"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: LogColors.milk.text }}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0ml</span>
                            <span>150ml</span>
                            <span>300ml</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">メモ</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 resize-none"
                            style={{ '--tw-ring-color': LogColors.milk.text } as React.CSSProperties}
                            placeholder="メモを入力..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className={cn(
                                "flex-1 py-3 font-bold text-white rounded-xl shadow-md active:scale-95 transition-transform bg-gradient-to-r",
                                themeClasses.saveBtn
                            )}
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
