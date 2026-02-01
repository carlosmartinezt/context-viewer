import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { callClaude } from '../../services/claudeServer';

interface VoiceInputProps {
  userEmail: string;
  placeholder?: string;
}

type RequestStatus = 'idle' | 'calling' | 'success' | 'error';

interface SavedRequest {
  id: string;
  text: string;
  response?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

// Load saved requests from localStorage
function loadSavedRequests(): SavedRequest[] {
  try {
    const saved = localStorage.getItem('chess-tracker-requests');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((r: SavedRequest) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function VoiceInput({ userEmail, placeholder = "What's happening with chess?" }: VoiceInputProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<SavedRequest[]>(loadSavedRequests);

  const handleCallClaude = async () => {
    if (!text.trim()) return;

    const requestText = text.trim();
    setStatus('calling');
    setError(null);
    setCurrentResponse(null);

    // Create pending request
    const newRequest: SavedRequest = {
      id: crypto.randomUUID(),
      text: requestText,
      timestamp: new Date(),
      status: 'pending'
    };

    const updatedRequests = [newRequest, ...recentRequests].slice(0, 10);
    setRecentRequests(updatedRequests);
    localStorage.setItem('chess-tracker-requests', JSON.stringify(updatedRequests));

    try {
      const response = await callClaude(requestText, userEmail);

      // Update request with response
      newRequest.response = response;
      newRequest.status = 'completed';
      const finalRequests = [newRequest, ...recentRequests.filter(r => r.id !== newRequest.id)].slice(0, 10);
      setRecentRequests(finalRequests);
      localStorage.setItem('chess-tracker-requests', JSON.stringify(finalRequests));

      setCurrentResponse(response);
      setStatus('success');
      setText('');

      // Invalidate all queries to refresh data from Google Drive
      // Claude may have updated any markdown file
      await queryClient.invalidateQueries();
    } catch (err) {
      // Update request as failed
      newRequest.status = 'failed';
      newRequest.response = err instanceof Error ? err.message : 'Unknown error';
      const finalRequests = [newRequest, ...recentRequests.filter(r => r.id !== newRequest.id)].slice(0, 10);
      setRecentRequests(finalRequests);
      localStorage.setItem('chess-tracker-requests', JSON.stringify(finalRequests));

      setError(err instanceof Error ? err.message : 'Failed to call Claude');
      setStatus('error');
    }
  };

  const clearRequest = (id: string) => {
    const updated = recentRequests.filter(r => r.id !== id);
    setRecentRequests(updated);
    localStorage.setItem('chess-tracker-requests', JSON.stringify(updated));
  };

  const dismissResponse = () => {
    setCurrentResponse(null);
    setStatus('idle');
  };

  return (
    <div className="space-y-3">
      {/* Input Area */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-500 flex-1">
            {status === 'calling' && 'Calling Claude...'}
            {status === 'success' && 'Claude responded!'}
            {status === 'error' && 'Request failed'}
            {status === 'idle' && !text && placeholder}
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your request..."
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={status === 'calling'}
        />

        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-gray-400">
            Examples: "Cancel Thursday's lesson" or "What tournaments are coming up?"
          </div>
          <button
            onClick={handleCallClaude}
            disabled={!text.trim() || status === 'calling'}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {status === 'calling' ? (
              <>
                <span className="animate-spin">⏳</span>
                Marinating...
              </>
            ) : (
              'Ask Claude'
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Claude Response Display */}
      {currentResponse && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-blue-800">Claude's Response</p>
            <button
              onClick={dismissResponse}
              className="text-blue-400 hover:text-blue-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{currentResponse}</p>
        </div>
      )}

      {/* Recent Requests */}
      {recentRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Recent Requests</h3>
          {recentRequests.slice(0, 3).map((request) => (
            <div
              key={request.id}
              className={`card text-sm ${
                request.status === 'pending'
                  ? 'border-l-4 border-l-amber-400'
                  : request.status === 'completed'
                  ? 'border-l-4 border-l-green-400'
                  : 'border-l-4 border-l-red-400'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-gray-800">{request.text}</p>
                  {request.response && request.status === 'completed' && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {request.response}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {request.status === 'pending' && '⏳ Processing...'}
                    {request.status === 'completed' && '✅ Completed'}
                    {request.status === 'failed' && '❌ Failed'}
                    {' · '}
                    {formatTimeAgo(request.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => clearRequest(request.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
