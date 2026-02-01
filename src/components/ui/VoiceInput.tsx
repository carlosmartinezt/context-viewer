import { useState, useEffect } from 'react';

interface VoiceInputProps {
  onSubmit?: (text: string) => void;
  placeholder?: string;
}

type RequestStatus = 'idle' | 'processing' | 'submitted';

interface SavedRequest {
  id: string;
  text: string;
  timestamp: Date;
  status: 'pending' | 'completed';
}

export function VoiceInput({ onSubmit, placeholder = "What's happening with chess?" }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [recentRequests, setRecentRequests] = useState<SavedRequest[]>([]);

  // Load recent requests from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chess-tracker-requests');
    if (saved) {
      const parsed = JSON.parse(saved);
      setRecentRequests(parsed.map((r: SavedRequest) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })));
    }
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) return;

    setStatus('processing');

    // Save request to localStorage for Claude to process
    const newRequest: SavedRequest = {
      id: crypto.randomUUID(),
      text: text.trim(),
      timestamp: new Date(),
      status: 'pending'
    };

    const updatedRequests = [newRequest, ...recentRequests].slice(0, 10);
    setRecentRequests(updatedRequests);
    localStorage.setItem('chess-tracker-requests', JSON.stringify(updatedRequests));

    // Call onSubmit callback if provided
    onSubmit?.(text.trim());

    // Clear and show confirmation
    setText('');
    setStatus('submitted');

    setTimeout(() => setStatus('idle'), 2000);
  };

  const clearRequest = (id: string) => {
    const updated = recentRequests.filter(r => r.id !== id);
    setRecentRequests(updated);
    localStorage.setItem('chess-tracker-requests', JSON.stringify(updated));
  };

  return (
    <div className="space-y-3">
      {/* Input Area */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-500 flex-1">
            {status === 'processing' && 'Saving request...'}
            {status === 'submitted' && 'Request saved for Claude!'}
            {status === 'idle' && !text && placeholder}
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or speak your request..."
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />

        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-gray-400">
            Examples: "Cancel Thursday's lesson" or "Add tournament March 15"
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || status === 'processing'}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'processing' ? 'Saving...' : 'Save for Claude'}
          </button>
        </div>
      </div>

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
                  : 'border-l-4 border-l-green-400'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-gray-800">{request.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {request.status === 'pending' ? '⏳ Pending' : '✅ Completed'}
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
