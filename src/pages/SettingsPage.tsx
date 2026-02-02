import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import {
  getRootFolderId,
  getRootFolderName,
  setRootFolderId,
  clearRootFolder,
  getFolder,
} from '../services/googleDrive';

declare global {
  interface Window {
    google?: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: { FOLDERS: string };
        Feature: { NAV_HIDDEN: string };
        Action: { PICKED: string; CANCEL: string };
        DocsView: new (viewId: string) => GoogleDocsView;
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
  }
}

interface GooglePickerBuilder {
  addView: (view: GoogleDocsView) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setCallback: (callback: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
  enableFeature: (feature: string) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

interface GoogleDocsView {
  setSelectFolderEnabled: (enabled: boolean) => GoogleDocsView;
  setMimeTypes: (types: string) => GoogleDocsView;
}

interface GooglePickerResponse {
  action: string;
  docs?: Array<{ id: string; name: string }>;
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [rootFolderName, setRootFolderName] = useState<string | null>(getRootFolderName());
  const [pickerLoaded, setPickerLoaded] = useState(false);

  useEffect(() => {
    const loadPicker = () => {
      if (window.gapi) {
        window.gapi.load('picker', () => {
          setPickerLoaded(true);
        });
      }
    };

    if (!document.getElementById('google-api-script')) {
      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = loadPicker;
      document.body.appendChild(script);
    } else if (window.gapi) {
      loadPicker();
    }
  }, []);

  const handleForceRefresh = () => {
    queryClient.invalidateQueries();
  };

  const handleForceRelogin = () => {
    localStorage.removeItem('context-viewer-user');
    window.location.reload();
  };

  const handleSelectFolder = () => {
    if (!window.google?.picker || !user?.accessToken) return;

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
      .setSelectFolderEnabled(true)
      .setMimeTypes('application/vnd.google-apps.folder');

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(user.accessToken)
      .setTitle('Select Root Folder')
      .setCallback(async (data: GooglePickerResponse) => {
        if (data.action === window.google!.picker.Action.PICKED && data.docs?.[0]) {
          const folder = data.docs[0];
          setRootFolderId(folder.id, folder.name);
          setRootFolderName(folder.name);
          queryClient.invalidateQueries();
        }
      })
      .build();

    picker.setVisible(true);
  };

  const handleClearFolder = async () => {
    clearRootFolder();
    setRootFolderName(null);
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    async function verifyFolder() {
      const folderId = getRootFolderId();
      if (folderId && !rootFolderName && user?.accessToken) {
        try {
          const folder = await getFolder(user.accessToken, folderId);
          setRootFolderName(folder.name);
          setRootFolderId(folderId, folder.name);
        } catch {
          clearRootFolder();
        }
      }
    }
    verifyFolder();
  }, [user?.accessToken, rootFolderName]);

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
            onClick={handleSelectFolder}
            disabled={!pickerLoaded}
            className="w-full py-2.5 text-[var(--color-accent)] font-medium border border-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-subtle)] transition-colors disabled:opacity-50"
          >
            {rootFolderName ? 'Change Folder' : 'Select Root Folder'}
          </button>
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
            className="w-full py-3 text-amber-600 font-medium border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
          >
            Force Re-login
          </button>
          <button
            onClick={signOut}
            className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </section>

      {/* Version */}
      <div className="text-center text-sm text-[var(--color-text-tertiary)]">
        Context Viewer v1.0.0
      </div>
    </div>
  );
}
