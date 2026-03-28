'use client';

import { AvatarPicker } from '@/components/AvatarPicker';
import { apiPath } from '@/lib/app-paths';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('fox');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(apiPath('/api/auth/me'), { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.user) {
          router.replace('/login');
          return;
        }

        setUser(result.user);
        setDisplayName(result.user.displayName || '');
        setAvatar(result.user.avatar || 'fox');
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [router]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body: { displayName?: string; avatar?: string; currentPassword?: string; newPassword?: string } = {};

      if (displayName.trim()) {
        body.displayName = displayName.trim();
      }

      if (avatar) {
        body.avatar = avatar;
      }

      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const response = await fetch(apiPath('/api/auth/me'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Failed to update profile.');
        return;
      }

      setUser(result.user);
      setDisplayName(result.user.displayName || '');
      setAvatar(result.user.avatar || 'fox');
      setCurrentPassword('');
      setNewPassword('');
      window.dispatchEvent(new CustomEvent('hypergamer:user-updated', { detail: { user: result.user } }));
      setSuccess('Profile updated.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Unable to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(apiPath('/api/auth/logout'), { method: 'POST' });
      router.replace('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Unable to log out right now.');
    } finally {
      setLoggingOut(false);
    }
  }

  function handleBackupFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setBackupFile(file);
    setTransferError(null);
    setTransferSuccess(file ? `Selected backup file: ${file.name}` : null);
  }

  async function handleExportBackup() {
    setTransferError(null);
    setTransferSuccess(null);
    setExportingBackup(true);

    try {
      const response = await fetch(apiPath('/api/profile/backup'), {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setTransferError(result.error || 'Failed to export backup.');
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition');
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] || `hypergamer-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setTransferSuccess(`Backup exported as ${filename}.`);
    } catch (err) {
      console.error('Error exporting backup:', err);
      setTransferError('Unable to export backup.');
    } finally {
      setExportingBackup(false);
    }
  }

  async function handleImportBackup() {
    if (!backupFile) {
      setTransferError('Select a backup JSON file before importing.');
      return;
    }

    setTransferError(null);
    setTransferSuccess(null);
    setImportingBackup(true);

    try {
      const text = await backupFile.text();
      const parsedBackup = JSON.parse(text);

      const response = await fetch(apiPath('/api/profile/backup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBackup),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTransferError(result.error || 'Failed to import backup.');
        return;
      }

      if (result.user) {
        setUser(result.user);
        setDisplayName(result.user.displayName || '');
        setAvatar(result.user.avatar || 'fox');
        window.dispatchEvent(new CustomEvent('hypergamer:user-updated', { detail: { user: result.user } }));
      }

      const imported = result.imported || {};
      const pieces = [
        `${imported.workoutsCreated || 0} workouts added`,
        `${imported.workoutsSkipped || 0} duplicate workouts skipped`,
        `${imported.biometricsUpserted || 0} biometrics merged`,
        `${imported.nutritionsUpserted || 0} nutrition entries merged`,
        `${(imported.targetsCreated || 0) + (imported.targetsUpdated || 0)} targets merged`,
      ];
      setTransferSuccess(`Import complete: ${pieces.join(', ')}.`);
      setBackupFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error importing backup:', err);
      setTransferError('Unable to import backup. Make sure the file is valid JSON exported by HyperGamer.');
    } finally {
      setImportingBackup(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>

      <div className="surface-card p-4 sm:p-6 space-y-5">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-lg"
              required
              minLength={2}
            />
          </div>

          <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Change password (optional)</p>
            <div>
              <label htmlFor="currentPassword" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/import"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 text-center"
            >
              Import Data
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Backup &amp; Transfer</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Export your logged exercise sets and progress as a JSON backup, then import that same file into another HyperGamer account or instance.
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Included data: workouts and sets, biometrics, nutrition entries, and targets. Imports merge by date and skip identical workouts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={exportingBackup}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {exportingBackup ? 'Exporting Backup...' : 'Export Backup'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600"
          >
            Choose Backup File
          </button>

          <button
            type="button"
            onClick={handleImportBackup}
            disabled={!backupFile || importingBackup}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {importingBackup ? 'Importing Backup...' : 'Import Backup'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleBackupFileChange}
        />

        {backupFile && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ready to import: <span className="font-medium text-gray-900 dark:text-gray-100">{backupFile.name}</span>
          </p>
        )}

        {transferError && <p className="text-sm text-red-600 dark:text-red-400">{transferError}</p>}
        {transferSuccess && <p className="text-sm text-green-600 dark:text-green-400">{transferSuccess}</p>}
      </div>
    </div>
  );
}
