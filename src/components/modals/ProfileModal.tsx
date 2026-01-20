import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { BabyProfile } from '../../types';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { getThemeClasses } from '../../lib/theme';
import { ThemeColors } from '../../lib/colors';

interface ProfileModalProps {
    isOpen: boolean;
    onSave: (profile: BabyProfile) => void;
    onClose: () => void;
    canClose: boolean;
    initialData?: BabyProfile;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onSave, onClose, canClose, initialData }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');

    // Use default theme for profile extraction since it might be new
    const themeClasses = getThemeClasses();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setBirthDate(initialData.birthDate);
            } else {
                setName('');
                setBirthDate('');
            }
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        if (!name) return;
        const newProfile: BabyProfile = {
            id: initialData ? initialData.id : uuidv4(),
            name,
            birthDate,
            themeColor: initialData ? initialData.themeColor : 'default',
        };
        onSave(newProfile);
        setName('');
        setBirthDate('');
    };

    if (!isOpen) return null;

    const title = initialData ? "プロフィールの編集" : "赤ちゃんの登録";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        {canClose && (
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                                <X size={24} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">お名前</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-4 rounded-xl bg-gray-50 border-2 border-transparent outline-none transition-all font-bold text-lg focus:bg-white"
                                style={{ borderColor: name ? ThemeColors.default.primary : 'transparent' }}
                                placeholder="例: 太郎"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">お誕生日 (任意)</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full p-4 rounded-xl bg-gray-50 border-2 border-transparent outline-none transition-all focus:bg-white"
                                style={{ borderColor: birthDate ? ThemeColors.default.primary : 'transparent' }}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!name}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                                !name ? "bg-gray-300 cursor-not-allowed" : themeClasses.saveBtn
                            )}
                        >
                            保存する
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
