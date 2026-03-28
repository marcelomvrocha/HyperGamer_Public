import basePathHelpers from '@/lib/base-path';

const { getConfiguredBasePath } = basePathHelpers;
const BASE_PATH = getConfiguredBasePath();

export function appPath(path = '/') {
  if (!path || path === '/') {
    return BASE_PATH || '/';
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiPath(path: string) {
  return appPath(path);
}
