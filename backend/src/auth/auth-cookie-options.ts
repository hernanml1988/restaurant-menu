import { CookieOptions } from 'express';

function isHttpsUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function shouldUseCrossSiteCookies() {
  return isHttpsUrl(process.env.FRONTEND_PUBLIC_URL);
}

export function buildAuthCookieOptions(maxAge: number): CookieOptions {
  const crossSiteCookies = shouldUseCrossSiteCookies();

  return {
    httpOnly: true,
    sameSite: crossSiteCookies ? 'none' : 'strict',
    secure: crossSiteCookies || process.env.NODE_ENV === 'production',
    maxAge,
  };
}

export function buildExpiredAuthCookieOptions(): CookieOptions {
  const crossSiteCookies = shouldUseCrossSiteCookies();

  return {
    httpOnly: true,
    sameSite: crossSiteCookies ? 'none' : 'strict',
    secure: crossSiteCookies || process.env.NODE_ENV === 'production',
    expires: new Date(0),
  };
}
