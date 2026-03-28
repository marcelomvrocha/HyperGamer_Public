export type AvatarOption = {
  id: string;
  icon: string;
  label: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'fox', icon: '🦊', label: 'Fox' },
  { id: 'cat', icon: '🐱', label: 'Cat' },
  { id: 'dog', icon: '🐶', label: 'Dog' },
  { id: 'panda', icon: '🐼', label: 'Panda' },
  { id: 'lion', icon: '🦁', label: 'Lion' },
  { id: 'owl', icon: '🦉', label: 'Owl' },
  { id: 'whale', icon: '🐳', label: 'Whale' },
  { id: 'robot', icon: '🤖', label: 'Robot' },
  { id: 'astronaut', icon: '🧑‍🚀', label: 'Astronaut' },
  { id: 'wizard', icon: '🧙', label: 'Wizard' },
  { id: 'ninja', icon: '🥷', label: 'Ninja' },
  { id: 'unicorn', icon: '🦄', label: 'Unicorn' },
];

const AVATAR_OPTION_IDS = new Set(AVATAR_OPTIONS.map(option => option.id));
const DEFAULT_AVATAR_ID = AVATAR_OPTIONS[0].id;

export function isValidAvatarId(value: string): boolean {
  return AVATAR_OPTION_IDS.has(value);
}

export function normalizeAvatarId(value?: string | null): string {
  if (!value) return DEFAULT_AVATAR_ID;
  return isValidAvatarId(value) ? value : DEFAULT_AVATAR_ID;
}

export function getAvatarOptionById(value?: string | null): AvatarOption {
  const normalized = normalizeAvatarId(value);
  return AVATAR_OPTIONS.find(option => option.id === normalized) ?? AVATAR_OPTIONS[0];
}

export function getAvatarIdFromSeed(seed?: string | null): string {
  if (!seed) return DEFAULT_AVATAR_ID;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_OPTIONS[hash % AVATAR_OPTIONS.length].id;
}
