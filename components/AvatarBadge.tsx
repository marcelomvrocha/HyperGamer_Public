import { getAvatarOptionById } from '@/lib/avatars';

type AvatarBadgeProps = {
  avatar?: string | null;
  className?: string;
};

export function AvatarBadge({ avatar, className }: AvatarBadgeProps) {
  const option = getAvatarOptionById(avatar);

  return (
    <span
      className={className ?? 'flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-lg'}
      aria-label={option.label}
      title={option.label}
    >
      {option.icon}
    </span>
  );
}
