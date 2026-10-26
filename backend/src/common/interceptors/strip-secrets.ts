const SECRET_KEYS = new Set(['passwordHash', 'tokenHash']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Retire récursivement les champs secrets (hash de mot de passe, de jeton) d'une réponse. */
export function stripSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripSecrets(item)) as T;
  }
  if (isPlainObject(value)) {
    const clean: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (!SECRET_KEYS.has(key)) {
        clean[key] = stripSecrets(item);
      }
    }
    return clean as T;
  }
  return value;
}
