const DEFAULT_BASE_PATH = '';

function normalizeBasePath(value) {
  if (typeof value !== 'string') {
    return DEFAULT_BASE_PATH;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

function getConfiguredBasePath(env = process.env, fallback = DEFAULT_BASE_PATH) {
  const hasExplicitBasePath = Object.prototype.hasOwnProperty.call(env, 'NEXT_PUBLIC_BASE_PATH');
  const rawValue = hasExplicitBasePath ? env.NEXT_PUBLIC_BASE_PATH : fallback;
  return normalizeBasePath(rawValue);
}

module.exports = {
  DEFAULT_BASE_PATH,
  getConfiguredBasePath,
  normalizeBasePath,
};
