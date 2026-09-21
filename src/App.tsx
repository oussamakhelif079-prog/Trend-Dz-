import React, { useState } from 'react';
import { AppStoreProvider, useAppStore } from './lib/store';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FeedView } from './components/FeedView';
import { TrendView } from './components/TrendView';
import { SearchView } from './components/SearchView';
import { ProfileView } from './components/ProfileView';
import { CreatePostModal } from './components/CreatePostModal';
import { CommentsBottomSheet } from './components/CommentsBottomSheet';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ReportModal } from './components/ReportModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';

const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab, toastMessage } = useAppStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const handleSelectHashtag = (tag: string) => {
    setSearchInitialQuery(tag);
    setCurrentTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectUser = (userId: string) => {
    setViewingProfileId(userId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-['Cairo',sans-serif] selection:bg-red-500 selection:text-white pb-safe">
      {/* Top Header */}
      <Header onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)} />

      {/* Main Tab Routing */}
      <main className="min-h-[calc(100vh-120px)]">
        {currentTab === 'feed' && (
          <FeedView
            onOpenCreate={() => setIsCreateOpen(true)}
            onSelectHashtag={handleSelectHashtag}
          />
        )}

        {currentTab === 'trend' && (
          <TrendView
            onSelectHashtag={handleSelectHashtag}
            onSelectUser={handleSelectUser}
          />
        )}

        {currentTab === 'search' && (
          <SearchView
            onSelectUser={handleSelectUser}
            initialQuery={searchInitialQuery}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            viewingUserId={viewingProfileId}
            onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav onOpenCreate={() => setIsCreateOpen(true)} />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-bounce-short border border-slate-700 dark:border-slate-300">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Overlays */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <CommentsBottomSheet />
      <AIAssistantModal />
      <AuthModal />
      <NotificationsModal />
      <ReportModal />
      <FirebaseConfigModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}
