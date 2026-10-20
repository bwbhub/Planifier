/** Au-delà de ce nombre de clés, les fenêtres expirées sont purgées (mémoire bornée). */
const SWEEP_THRESHOLD = 10_000;

interface Window {
  startedAt: number;
  count: number;
}

export interface RateLimitRule {
  max: number;
  windowMs: number;
}

/** Règle des plans oRPC : 120 requêtes par minute et par IP. */
export const PLAN_RATE_LIMIT: RateLimitRule = { max: 120, windowMs: 60_000 };

/**
 * Limiteur à fenêtre fixe, en mémoire du processus. Suffisant pour une seule instance d'API ; à remplacer par un
 * stockage partagé avant d'en lancer plusieurs (même dette que la limitation de Better Auth).
 */
export function createRateLimiter(rule: RateLimitRule, now: () => number = Date.now) {
  const windows = new Map<string, Window>();

  function sweep(at: number) {
    for (const [key, window] of windows) {
      if (at - window.startedAt >= rule.windowMs) windows.delete(key);
    }
  }

  /** Compte une requête pour `key` ; `false` si la limite de la fenêtre courante est déjà atteinte. */
  return function consume(key: string): boolean {
    const at = now();
    const current = windows.get(key);
    if (current === undefined || at - current.startedAt >= rule.windowMs) {
      if (windows.size >= SWEEP_THRESHOLD) sweep(at);
      windows.set(key, { startedAt: at, count: 1 });
      return true;
    }
    if (current.count >= rule.max) return false;
    current.count += 1;
    return true;
  };
}
