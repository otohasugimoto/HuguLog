import React, { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { Baby } from 'lucide-react';

export const LoginScreen: React.FC = () => {
    const { login } = useFamily();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        setError(null);

        const { success, error: loginError } = await login(code.trim());
        if (!success) {
            setError(loginError || 'エラーが発生しました');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500">
                        <Baby size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">BabyLog</h1>
                    <p className="text-gray-500 text-sm mt-2 text-center">
                        家族IDを入力して始める<br />
                        (パートナーと同じIDを入力すると共有できます)
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            家族ID (合言葉)
                        </label>
                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="例: suzuki-family-2024"
                            className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold text-lg text-center"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg font-bold text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !code.trim()}
                        className="w-full py-4 text-white font-bold rounded-xl bg-blue-500 hover:bg-blue-600 shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'ログイン中...' : '始める'}
                    </button>
                </form>
            </div>
        </div>
    );
};
