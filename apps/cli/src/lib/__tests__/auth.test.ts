import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../config.js', () => ({
  getAuth: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
}));

vi.mock('../output.js', () => ({
  default: {
    info: vi.fn(),
    log: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    colors: {
      muted: (s: string) => s,
      link: (s: string) => s,
    },
  },
}));

vi.mock('../convex.js', () => ({
  resetClient: vi.fn(),
}));

import { isValidTokenFormat, loginWithToken, getAuthStatus } from '../auth.js';
import { getAuth, clearAuth } from '../config.js';

describe('isValidTokenFormat', () => {
  it('accepts a valid JWT format (3 base64url parts separated by dots)', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(isValidTokenFormat(jwt)).toBe(true);
  });

  it('accepts a minimal JWT with short segments', () => {
    const jwt = 'abc.def.ghi';
    expect(isValidTokenFormat(jwt)).toBe(true);
  });

  it('accepts a JWT with base64url characters (underscores and hyphens)', () => {
    const jwt = 'abc_def-123.ghi_jkl-456.mno_pqr-789';
    expect(isValidTokenFormat(jwt)).toBe(true);
  });

  it('accepts a valid opaque token (20+ alphanumeric characters)', () => {
    const opaque = 'abcdefghijklmnopqrstuvwxyz';
    expect(isValidTokenFormat(opaque)).toBe(true);
  });

  it('accepts an opaque token with underscores and hyphens', () => {
    const opaque = 'abcd_efgh-ijkl_mnop-qrst';
    expect(isValidTokenFormat(opaque)).toBe(true);
  });

  it('accepts an opaque token of exactly 20 characters', () => {
    const opaque = '12345678901234567890';
    expect(isValidTokenFormat(opaque)).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidTokenFormat('')).toBe(false);
  });

  it('rejects a short token (less than 20 chars, non-JWT)', () => {
    expect(isValidTokenFormat('short')).toBe(false);
    expect(isValidTokenFormat('1234567890123456789')).toBe(false); // 19 chars
  });

  it('rejects tokens with invalid characters (spaces)', () => {
    expect(isValidTokenFormat('abcdefghijklmnopqrst uvwx')).toBe(false);
  });

  it('rejects tokens with invalid characters (special symbols)', () => {
    expect(isValidTokenFormat('abcdefghijklmnopqrst!@#$')).toBe(false);
  });

  it('rejects a JWT-like string with only two segments', () => {
    expect(isValidTokenFormat('abc.def')).toBe(false);
  });

  it('rejects a JWT-like string with four segments', () => {
    expect(isValidTokenFormat('abc.def.ghi.jkl')).toBe(false);
  });
});

describe('loginWithToken', () => {
  it('rejects an empty token', async () => {
    await expect(loginWithToken('')).rejects.toThrow('Invalid token format');
  });

  it('rejects an invalid format token (short string)', async () => {
    await expect(loginWithToken('tooshort')).rejects.toThrow('Invalid token format');
  });

  it('returns an AuthConfig for a valid opaque token', async () => {
    const token = 'validOpaqueToken12345678';
    const result = await loginWithToken(token);
    expect(result).toEqual({
      token,
      tokenType: 'api',
      expiresAt: undefined,
    });
  });

  it('returns AuthConfig with tokenType set to api', async () => {
    const token = 'anotherValidToken123456';
    const result = await loginWithToken(token);
    expect(result.tokenType).toBe('api');
  });

  it('returns AuthConfig with no expiration for API tokens', async () => {
    const token = 'noExpiryTokenValue12345';
    const result = await loginWithToken(token);
    expect(result.expiresAt).toBeUndefined();
  });

  it('returns AuthConfig for a valid JWT token', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const result = await loginWithToken(jwt);
    expect(result).toEqual({
      token: jwt,
      tokenType: 'api',
      expiresAt: undefined,
    });
  });
});

describe('getAuthStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns { authenticated: false } when no auth is stored', () => {
    vi.mocked(getAuth).mockReturnValue(undefined);
    const status = getAuthStatus();
    expect(status).toEqual({ authenticated: false });
  });

  it('returns { authenticated: false } when auth has no token', () => {
    vi.mocked(getAuth).mockReturnValue({ tokenType: 'api' });
    const status = getAuthStatus();
    expect(status).toEqual({ authenticated: false });
  });

  it('returns authenticated status with details for valid stored auth', () => {
    const futureExpiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
    vi.mocked(getAuth).mockReturnValue({
      token: 'storedTokenValue1234567',
      tokenType: 'clerk',
      email: 'user@example.com',
      userId: 'user_123',
      expiresAt: futureExpiry,
    });

    const status = getAuthStatus();
    expect(status.authenticated).toBe(true);
    expect(status.type).toBe('clerk');
    expect(status.email).toBe('user@example.com');
    expect(status.userId).toBe('user_123');
    expect(status.expiresAt).toBeInstanceOf(Date);
  });

  it('returns { authenticated: false } and clears auth when token is expired', () => {
    const pastExpiry = Date.now() - 60 * 1000; // 1 minute ago
    vi.mocked(getAuth).mockReturnValue({
      token: 'expiredTokenValue12345',
      tokenType: 'clerk',
      expiresAt: pastExpiry,
    });

    const status = getAuthStatus();
    expect(status).toEqual({ authenticated: false });
    expect(clearAuth).toHaveBeenCalled();
  });

  it('returns authenticated with no expiresAt for API tokens without expiration', () => {
    vi.mocked(getAuth).mockReturnValue({
      token: 'apiTokenNoExpiry123456',
      tokenType: 'api',
    });

    const status = getAuthStatus();
    expect(status.authenticated).toBe(true);
    expect(status.type).toBe('api');
    expect(status.expiresAt).toBeUndefined();
  });
});
