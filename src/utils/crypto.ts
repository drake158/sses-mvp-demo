import type { AuditLogEntry, IntegrityCheckResult } from '../types/sses';

export const GENESIS_HASH = '0'.repeat(64);

function normalizeForCanonicalJson(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      item === undefined ? null : normalizeForCanonicalJson(item)
    );
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const normalized: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const propVal = record[key];
    if (propVal !== undefined) {
      normalized[key] = normalizeForCanonicalJson(propVal);
    }
  }

  return normalized;
}

/**
 * Serializes any JSON-compatible value with recursively sorted object keys
 * so SHA-256 digests are deterministic across runtimes and reloads.
 */
export function canonicalStringify(value: unknown): string {
  return JSON.stringify(normalizeForCanonicalJson(value));
}

/**
 * Computes a real SHA-256 hexadecimal digest (64 lowercase chars) using
 * the native Web Crypto API (`globalThis.crypto.subtle.digest`).
 */
export async function computeSha256Hex(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Web Crypto API (crypto.subtle) no está disponible en este entorno.'
    );
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type AuditHashPayload = Omit<AuditLogEntry, 'hash'>;

/**
 * Computes the chained SHA-256 hash of an AuditLogEntry payload
 * (which already includes `previousHash`).
 */
export async function computeAuditEntryHash(
  payload: AuditHashPayload
): Promise<string> {
  return computeSha256Hex(canonicalStringify(payload));
}

/**
 * Verifies the entire audit_log cryptographic chain sequentially from index 0
 * (`GENESIS_HASH`) to the latest record.
 */
export async function verifyAuditChain(
  entries: AuditLogEntry[]
): Promise<IntegrityCheckResult> {
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const expectedPreviousHash = i === 0 ? GENESIS_HASH : entries[i - 1].hash;

    if (entry.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        totalVerified: i,
        brokenIndex: i,
        brokenEntryId: entry.id,
        reason: `Enlace roto en ${entry.id} (secuencia #${entry.secuencia}): previousHash no coincide con el hash del registro anterior.`,
      };
    }

    const { hash, ...payload } = entry;
    const recalculatedHash = await computeAuditEntryHash(payload);

    if (recalculatedHash !== hash) {
      return {
        valid: false,
        totalVerified: i,
        brokenIndex: i,
        brokenEntryId: entry.id,
        reason: `Alteración detectada en ${entry.id} (secuencia #${entry.secuencia}): el hash SHA-256 recalculado no coincide con el almacenado.`,
      };
    }
  }

  return {
    valid: true,
    totalVerified: entries.length,
    brokenIndex: null,
    brokenEntryId: null,
  };
}
