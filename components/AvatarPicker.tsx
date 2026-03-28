'use client';

import { AvatarBadge } from '@/components/AvatarBadge';
import { AVATAR_OPTIONS } from '@/lib/avatars';

type AvatarPickerProps = {
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
};

export function AvatarPicker({ selectedAvatar, onSelect }: AvatarPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-[2px]">
          <AvatarBadge
            avatar={selectedAvatar}
            className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-2xl"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose your icon</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Objects, people, and animals instead of initials.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {AVATAR_OPTIONS.map(option => {
          const isSelected = option.id === selectedAvatar;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`rounded-xl border p-2 transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500'
              }`}
              aria-pressed={isSelected}
              title={option.label}
            >
              <AvatarBadge
                avatar={option.id}
                className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-slate-900 text-2xl"
              />
              <span className="mt-1 block text-[11px] text-gray-600 dark:text-gray-300">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
