import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import { FolderPicker } from '../components/ui/FolderPicker';
import {
  getRootFolderId,
  getRootFolderName,
  setRootFolderId,
  clearRootFolder,
  getFolder,
  type DriveFolder,
} from '../services/googleDrive';

export function SettingsPage() {
  const { user, signOut, accessToken, requestToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rootFolderName, setRootFolderName] = useState<string | null>(getRootFolderName());
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleForceRefresh = () => {
    queryClient.invalidateQueries();
  };

  const handleForceRelogin = () => {
    signOut();
    navigate('/');
  };

  const handleOpenPicker = async () => {
    if (!accessToken) {
      // Try silent refresh with timeout, fall back to consent if blocked (e.g. mobile)
      const silentToken = await Promise.race([
        requestToken(''),
        new Promise<null>(r => setTimeout(() => r(null), 2000)),
      ]);
      if (!silentToken) {
        const token = await requestToken('consent');
        if (!token) return;
      }
    }
    setPickerOpen(true);
  };

  const handleFolderSelected = (folder: DriveFolder) => {
    setRootFolderId(folder.id, folder.name);
    queryClient.invalidateQueries();
    navigate('/');
  };

  const handleClearFolder = async () => {
    clearRootFolder();
    setRootFolderName(null);
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    async function verifyFolder() {
      const folderId = getRootFolderId();
      if (folderId && !rootFolderName && accessToken) {
        try {
          const folder = await getFolder(accessToken, folderId);
          setRootFolderName(folder.name);
          setRootFolderId(folderId, folder.name);
        } catch {
          clearRootFolder();
        }
      }
    }
    verifyFolder();
  }, [accessToken, rootFolderName]);

  return (
    <div className="py-6 lg:py-10 space-y-8">
      <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
        Settings
      </h1>

      {/* User Info */}
      {user && (
        <div className="card">
          <div className="flex items-center gap-4">
            <ProfileAvatar src={user.picture} name={user.name} size="lg" />
            <div>
              <div className="font-medium text-[var(--color-text)] text-lg">{user.name}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">{user.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Root Folder Selection */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Root Folder
        </h3>
        <div className="card space-y-4">
          {rootFolderName ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--color-text)]">{rootFolderName}</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Current root folder</p>
              </div>
              <button
                onClick={handleClearFolder}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-[var(--color-text-secondary)]">No folder selected</p>
          )}
          <button
            onClick={handleOpenPicker}
            className="w-full py-2.5 text-[var(--color-accent)] font-medium border border-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-subtle)] transition-colors"
          >
            {rootFolderName ? 'Change Folder' : 'Select Root Folder'}
          </button>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Appearance
        </h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-text)]">Theme</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {theme === 'system' ? 'Follow system' : theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <div className="flex gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-lg">
              <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-[var(--color-bg-elevated)] shadow-sm text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
                title="Light mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-colors ${
                  theme === 'system'
                    ? 'bg-[var(--color-bg-elevated)] shadow-sm text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
                title="System preference"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-[var(--color-bg-elevated)] shadow-sm text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
                title="Dark mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Actions
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleForceRefresh}
            className="w-full py-3 text-[var(--color-text)] font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={handleForceRelogin}
            className="w-full py-3 text-[var(--color-warning)] font-medium border border-[var(--color-warning-subtle)] rounded-lg hover:bg-[var(--color-warning-bg)] transition-colors"
          >
            Force Re-login
          </button>
          <button
            onClick={signOut}
            className="w-full py-3 text-[var(--color-danger)] font-medium border border-[var(--color-danger-subtle)] rounded-lg hover:bg-[var(--color-danger-bg)] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </section>

      {/* Version */}
      <div className="text-center text-sm text-[var(--color-text-tertiary)]">
        Context Viewer v1.0.0
      </div>

      <FolderPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleFolderSelected}
        accessToken={accessToken}
      />
    </div>
  );
}
