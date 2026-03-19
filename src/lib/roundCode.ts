/**
 * Deterministic round code generation synced to wall clock.
 * Each 60-second window (aligned to minute boundaries) gets a unique 11-digit code.
 * All clients + admin see the same codes.
 */

export function generateRoundCode(epochMinute: number): string {
  let x = epochMinute;
  let result = '';
  for (let i = 0; i < 11; i++) {
    x = ((x * 1103515245 + 12345) & 0x7fffffff);
    result += (x % 10).toString();
  }
  return result;
}

export function getCurrentEpochMinute(): number {
  return Math.floor(Date.now() / 60000);
}

/** Returns countdown (60 → 1) synced to wall clock seconds */
export function getCountdown(): number {
  const secondsIntoMinute = Math.floor(Date.now() / 1000) % 60;
  return 60 - secondsIntoMinute;
}

/** Get the current round code based on wall clock */
export function getCurrentRoundCode(): string {
  return generateRoundCode(getCurrentEpochMinute());
}

/** Get the next N round codes (for admin preview) */
export function getNextRoundCodes(count: number): { code: string; epochMinute: number; startsIn: number }[] {
  const currentMinute = getCurrentEpochMinute();
  const secondsIntoMinute = Math.floor(Date.now() / 1000) % 60;
  const result = [];
  
  for (let i = 0; i <= count; i++) {
    const minute = currentMinute + i;
    result.push({
      code: generateRoundCode(minute),
      epochMinute: minute,
      startsIn: i === 0 ? 0 : (60 - secondsIntoMinute) + (i - 1) * 60,
    });
  }
  
  return result;
}
