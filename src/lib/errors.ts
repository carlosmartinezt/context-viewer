/**
 * Two helpers for the one thing TypeScript makes you say out loud: a caught
 * value is `unknown`, not an Error. Both are used everywhere a catch block
 * wants the message or wants to tell one failure from another.
 */

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** Node's filesystem and child-process errors carry a string `code`. */
export function errorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'string') return code
  }
  return undefined
}
