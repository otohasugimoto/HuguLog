
import React, { useState } from 'react';
import type { LogEntry, BabyProfile, AppSettings } from '../../types';
import { format } from 'date-fns';
import { Copy, Check, Milk, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LogColors } from '../../lib/colors';
import { useFamily } from '../../contexts/FamilyContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEntry[];
    profiles: BabyProfile[];
    settings: AppSettings;
    onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, logs, profiles, settings, onUpdateSettings }) => {
    const { logout, familyCode } = useFamily();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleExport = () => {
        // CSV Header
        let csv = '日付,時間,名前,種別,詳細,メモ\n';

        // Sort logs by time
        const sortedLogs = [...logs].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        sortedLogs.forEach(log => {
            const profile = profiles.find(p => p.id === log.babyId);
            const name = profile?.name || 'Unknown';
            const date = format(new Date(log.startTime), 'yyyy/MM/dd');
            const time = format(new Date(log.startTime), 'HH:mm');

            let typeLabel = '';
            let detail = '';

            if (log.type === 'feed') {
                typeLabel = '授乳';
                detail = `${log.amount} ml`;
            } else if (log.type === 'sleep') {
                typeLabel = '睡眠';
                if (log.endTime) {
                    const diff = Math.floor((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000);
                    detail = `${diff} 分`;
                } else {
                    detail = '計測中';
                }
            } else if (log.type === 'diaper') {
                typeLabel = 'オムツ';
                const noteData = log.note ? JSON.parse(log.note) : {};
                if (noteData.type === 'pee') detail = '小便';
                else if (noteData.type === 'poop') detail = '大便';
                else detail = '両方';
            }

            // Handle simple note vs JSON note
            let noteContent = log.note;
            if (log.type === 'diaper' && log.note) {
                const parsed = JSON.parse(log.note);
                noteContent = parsed.note || '';
            }

            // Escape commas in note
            noteContent = noteContent ? `"${noteContent.replace(/"/g, '""')}"` : '';

            csv += `${date},${time},${name},${typeLabel},${detail},${noteContent}\n`;
        });

        navigator.clipboard.writeText(csv).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold mb-6 text-gray-700">設定</h2>

                <div className="space-y-6">
                    {/* Display Settings */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">表示設定</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: LogColors.milk.bg, color: LogColors.milk.text }}>
                                        <Milk size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-700">ミルクの目安</div>
                                        <div className="text-xs text-gray-400">タイムラインにゴーストを表示</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onUpdateSettings({ showGhost: !settings.showGhost })}
                                    className={cn(
                                        "w-12 h-7 rounded-full transition-colors relative",
                                        settings.showGhost ? "bg-opacity-100" : "bg-gray-300"
                                    )}
                                    style={{ backgroundColor: settings.showGhost ? LogColors.milk.text : undefined }}
                                >
                                    <div className={cn(
                                        "absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow transition-transform",
                                        settings.showGhost ? "translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>

                            {/* Ghost Mode Selection - Only show if Ghost is enabled */}
                            {settings.showGhost && (
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="text-xs font-bold text-gray-500 mb-2 px-1">ゴーストの基準</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => onUpdateSettings({ ghostMode: 'yesterday' })}
                                            className={cn(
                                                "py-2 px-3 rounded-lg text-sm font-bold transition-all",
                                                settings.ghostMode === 'yesterday'
                                                    ? "bg-white shadow-sm ring-1"
                                                    : "text-gray-400 hover:bg-gray-100"
                                            )}
                                            style={settings.ghostMode === 'yesterday' ? { color: LogColors.milk.text, '--tw-ring-color': LogColors.milk.activeBg } as React.CSSProperties : undefined}
                                        >
                                            昨日
                                        </button>
                                        <button
                                            onClick={() => onUpdateSettings({ ghostMode: 'average' })}
                                            className={cn(
                                                "py-2 px-3 rounded-lg text-sm font-bold transition-all",
                                                settings.ghostMode === 'average'
                                                    ? "bg-white shadow-sm ring-1"
                                                    : "text-gray-400 hover:bg-gray-100"
                                            )}
                                            style={settings.ghostMode === 'average' ? { color: LogColors.milk.text, '--tw-ring-color': LogColors.milk.activeBg } as React.CSSProperties : undefined}
                                        >
                                            過去3日平均
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">データ管理</h3>
                        <button
                            onClick={handleExport}
                            className={cn(
                                "w-full py-3 px-4 rounded-xl flex items-center justify-between transition-colors",
                                copied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            <span className="font-bold flex items-center gap-2">
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'コピーしました！' : 'ログをCSV形式でコピー'}
                            </span>
                            {!copied && <span className="text-xs bg-white px-2 py-1 rounded text-gray-500">Spreadsheet用</span>}
                        </button>
                        <p className="text-xs text-gray-400 mt-2 px-1">
                            Googleスプレッドシートなどに貼り付けられる形式でクリップボードにコピーします。
                        </p>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <button
                            onClick={onClose}
                            className="w-full py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl"
                        >
                            閉じる
                        </button>

                        <div className="text-center pt-2">
                            <button
                                onClick={() => {
                                    if (confirm('ログアウトしますか？')) {
                                        logout();
                                        onClose();
                                    }
                                }}
                                className="text-xs text-red-400 hover:text-red-500 flex items-center justify-center gap-1 w-full"
                            >
                                <LogOut size={12} />
                                家族ID: {familyCode} からログアウト
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
