import { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ProfileModal } from './components/modals/ProfileModal';
import { BottomNav } from './components/BottomNav';
import { FeedModal } from './components/modals/FeedModal';
import { SleepModal } from './components/modals/SleepModal';
import { DiaperModal } from './components/modals/DiaperModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { Timeline } from './components/Timeline';
import { useStore } from './store/useStore';
import type { LogEntry } from './types';
import { Settings } from 'lucide-react';
import { getThemeVariables } from './lib/theme';
import { useFamily } from './contexts/FamilyContext';
import { LoginScreen } from './components/LoginScreen';

function App() {
  const { familyId, isLoading: isAuthLoading } = useFamily();
  const { profiles, currentBabyId, addProfile, updateProfile, logs, addLog, updateLog, deleteLog, settings, setAppSettings } = useStore(familyId);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal states
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isDiaperOpen, setIsDiaperOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editingProfile, setEditingProfile] = useState<typeof profiles[0] | undefined>(undefined);

  const currentBaby = profiles.find(p => p.id === currentBabyId);
  const showOnboarding = profiles.length === 0;

  // Theme Variables
  const themeVars = currentBaby ? getThemeVariables(currentBaby.themeColor) : getThemeVariables('orange');

  // Check for active sleep
  const activeSleepLog = useMemo(() => {
    if (!currentBabyId) return undefined;
    return logs.find(l => l.babyId === currentBabyId && l.type === 'sleep' && !l.endTime);
  }, [logs, currentBabyId]);

  // Handlers
  const handleSaveLog = (log: LogEntry) => {
    const exists = logs.some(l => l.id === log.id);
    if (exists) {
      updateLog(log);
    } else {
      addLog(log);
    }
    setEditingLog(null);
  };

  const handleEditLog = (log: LogEntry) => {
    setEditingLog(log);
    if (log.type === 'feed') setIsFeedOpen(true);
    if (log.type === 'sleep') setIsSleepOpen(true);
    if (log.type === 'diaper') setIsDiaperOpen(true);
  };

  const handleCloseModal = () => {
    setIsFeedOpen(false);
    setIsSleepOpen(false);
    setIsDiaperOpen(false);
    setEditingLog(null);
  };

  const handleAddProfile = () => {
    setEditingProfile(undefined);
    setIsProfileModalOpen(true);
  };

  const handleEditProfile = () => {
    if (currentBaby) {
      setEditingProfile(currentBaby);
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = (profile: typeof profiles[0]) => {
    console.log('handleSaveProfile called', profile);
    const exists = profiles.some(p => p.id === profile.id);
    if (exists) {
      updateProfile(profile);
    } else {
      console.log('Adding new profile...');
      addProfile(profile);
    }
    setIsProfileModalOpen(false);
    setEditingProfile(undefined);
  };

  // Render Logic
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  if (!familyId) {
    return <LoginScreen />;
  }

  return (
    <div className="relative" style={themeVars}>
      <Layout
        currentBaby={currentBaby}
        onEditProfile={handleEditProfile}
        onAddProfile={handleAddProfile}
        headerRight={
          <button
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={24} />
          </button>
        }
      >
        {/* Active Sleep Indicator */}
        {activeSleepLog && (
          <div
            onClick={() => setIsSleepOpen(true)}
            className="bg-indigo-600 text-white p-3 text-center cursor-pointer sticky top-0 z-20 shadow-md animate-pulse"
          >
            🌙 ねんね中 (タップして起きる)
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {currentBabyId ? (
            <Timeline
              logs={logs}
              babyId={currentBabyId}
              onDeleteLog={deleteLog}
              showGhost={settings.showGhost}
              ghostMode={settings.ghostMode}
              onLogClick={handleEditLog}
              themeColor={currentBaby?.themeColor}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
              <div className="max-w-xs">
                <p className="mb-4">赤ちゃんを登録して記録を始めましょう</p>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-600 transition-colors"
                >
                  赤ちゃんを登録
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Bottom Navigation */}
      {currentBabyId && !showOnboarding && (
        <BottomNav
          onPressFeed={() => setIsFeedOpen(true)}
          onPressSleep={() => setIsSleepOpen(true)}
          onPressDiaper={() => setIsDiaperOpen(true)}
        />
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen || showOnboarding}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        canClose={!showOnboarding}
        initialData={editingProfile}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setAppSettings}
        logs={logs}
        profiles={profiles}
      />

      <FeedModal
        isOpen={isFeedOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLog}
        babyId={currentBabyId || ''}
        initialData={editingLog || undefined}
        themeColor={currentBaby?.themeColor}
      />

      <SleepModal
        isOpen={isSleepOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLog}
        babyId={currentBabyId || ''}
        activeSleepLog={activeSleepLog}
        initialData={editingLog || undefined}
        themeColor={currentBaby?.themeColor}
      />

      <DiaperModal
        isOpen={isDiaperOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLog}
        babyId={currentBabyId || ''}
        initialData={editingLog || undefined}
        themeColor={currentBaby?.themeColor}
      />
    </div>
  );
}
export default App;
