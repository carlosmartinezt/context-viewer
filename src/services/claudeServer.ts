/**
 * Client for calling the Claude server running on Mac
 * Uses Tailscale for secure access
 */

const SERVER_URL = import.meta.env.VITE_CLAUDE_SERVER_URL || '';

export interface ClaudeResponse {
  response: string;
  error?: string;
}

/**
 * Call Claude with a natural language request
 * @param request - The user's request (e.g., "Cancel tomorrow's lesson")
 * @param userEmail - The authenticated user's email
 * @returns Claude's response
 */
export async function callClaude(request: string, userEmail: string): Promise<string> {
  if (!SERVER_URL) {
    throw new Error('Claude server URL not configured');
  }

  const res = await fetch(`${SERVER_URL}/api/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, userEmail }),
  });

  const data: ClaudeResponse = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data.response;
}

/**
 * Check if the Claude server is reachable
 */
export async function checkServerHealth(): Promise<boolean> {
  if (!SERVER_URL) return false;

  try {
    const res = await fetch(`${SERVER_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
