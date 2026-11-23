import { describe, expect, it } from 'vitest';
import { stripSecrets } from './strip-secrets.js';

describe('stripSecrets', () => {
  it('retire passwordHash et tokenHash à tous les niveaux', () => {
    const result = stripSecrets({
      id: '1',
      guardians: [{ parent: { user: { email: 'a@b.c', passwordHash: 'x' } } }],
      tokenHash: 'y',
    });
    expect(JSON.stringify(result)).not.toContain('Hash');
    expect(result.guardians[0].parent.user.email).toBe('a@b.c');
  });

  it('conserve les dates, null et valeurs primitives', () => {
    const date = new Date('2026-01-01');
    expect(stripSecrets({ date, n: null, v: 3 })).toEqual({ date, n: null, v: 3 });
    expect(stripSecrets(null)).toBeNull();
    expect(stripSecrets('texte')).toBe('texte');
  });
});
